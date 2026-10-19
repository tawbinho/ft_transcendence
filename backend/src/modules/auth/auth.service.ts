import { randomBytes } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import * as argon2 from 'argon2';
import { QueryFailedError } from 'typeorm';
import { AppError } from '../../common/errors/app-error.js';
import { toPublicUser, type PublicUser } from '../users/public-user.js';
import { UsersService } from '../users/users.service.js';
import type { LoginDto } from './dto/login.dto.js';
import type { SignupDto } from './dto/signup.dto.js';
import { MailService } from './email/mail.service.js';
import { checkCode, newVerificationCode } from './email/verification-code.js';
import { SessionsService, type IssuedSession } from './sessions.service.js';
import { TwoFactorService } from './two-factor/two-factor.service.js';

// What signup, login and 2FA verification return: the user plus the session
// whose token the controller puts in the cookie.
export interface AuthResult {
  user: PublicUser;
  session: IssuedSession;
}

// Login for a user with 2FA: the password was right, but this is NOT a login
// yet. `session` is a short-lived PENDING session: its cookie is only good for
// the 2FA verification route.
export interface TwoFactorRequired {
  twoFactorRequired: true;
  session: IssuedSession;
}

// WHY THIS FILE EXISTS
// The business rules of authentication live here, not in the controller:
// signup, login (with the optional 2FA step), logout, and "who am I".
@Injectable()
export class AuthService {
  // A hash of a random password nobody knows. Used to spend the same time
  // verifying when the email does not exist (see login).
  private readonly dummyHash = argon2.hash(randomBytes(16).toString('hex'));

  constructor(
    private readonly users: UsersService,
    private readonly sessions: SessionsService,
    private readonly twoFactor: TwoFactorService,
    private readonly mail: MailService,
  ) {}

  private readonly log = new Logger(AuthService.name);

  // Creates the account UNVERIFIED and emails a code. It does not log in:
  // the person must prove they own the email first (see login).
  async signup(dto: SignupDto): Promise<void> {
    // 0. An account that never verified its email proves nothing, so it must
    //    not block the real owner of that email (or name): replace it.
    for (const old of [
      await this.users.findByEmail(dto.email),
      await this.users.findByDisplayName(dto.displayName),
    ]) {
      if (old && !old.emailVerifiedAt && !old.isBot) await this.users.deleteById(old.id);
    }

    // 1. Friendly early check. The email was already trimmed and lowercased
    //    by the DTO, so "A@x.com" and "a@x.com" are the same account.
    if (await this.users.findByEmail(dto.email)) {
      throw new AppError('EMAIL_TAKEN', 'This email is already registered', 409);
    }
    if (await this.users.findByDisplayName(dto.displayName)) {
      throw new AppError(
        'DISPLAY_NAME_TAKEN',
        'This display name is already taken',
        409,
      );
    }

    // 2. Never store the password: store its argon2 hash. The hash includes
    //    a random salt and its own settings, so it can be verified later.
    const passwordHash = await argon2.hash(dto.password);

    // 3. Save. The checks above are not atomic: two simultaneous signups can
    //    both pass them. The database unique constraints are the real
    //    guarantee, so a violation is turned into the same friendly error.
    let user;
    try {
      user = await this.users.create({
        email: dto.email,
        displayName: dto.displayName,
        passwordHash,
      });
    } catch (error) {
      throw this.translateUniqueViolation(error) ?? error;
    }

    // 4. Send the verification email. If it cannot be sent the account is
    //    useless (nobody could verify it), so remove it and let them retry.
    try {
      await this.sendVerification(user.id);
    } catch (error) {
      this.log.warn(`Verification email failed: ${String(error)}`);
      await this.users.deleteById(user.id);
      throw new AppError(
        'EMAIL_SEND_FAILED',
        'We could not send the verification email, please try again',
        502,
      );
    }
  }

  async login(dto: LoginDto): Promise<AuthResult | TwoFactorRequired> {
    const user = await this.users.findByEmail(dto.email);

    // Unknown email and wrong password must be indistinguishable: same error
    // AND same duration. So when there is no user (or an OAuth-only user with
    // no password), we still verify against the dummy hash, which can never
    // match. Otherwise the response time would reveal which emails exist.
    const hash = user?.passwordHash ?? (await this.dummyHash);
    const passwordOk = await argon2.verify(hash, dto.password);

    if (!user || !user.passwordHash || !passwordOk) {
      throw new AppError('INVALID_CREDENTIALS', 'Email or password is incorrect', 401);
    }

    // Password correct, but the email is not proven yet: no login. A new code
    // is sent, so a lost email is not a dead end.
    if (!user.emailVerifiedAt) {
      await this.sendVerification(user.id).catch((e) =>
        this.log.warn(`Verification email failed: ${String(e)}`),
      );
      throw new AppError(
        'EMAIL_NOT_VERIFIED',
        'Please verify your email first: we sent you a new code',
        403,
      );
    }

    // Password correct. With 2FA on, that is NOT enough to log in: create a
    // short-lived PENDING session and wait for the code (verifyTwoFactor).
    if (await this.twoFactor.isEnabled(user.id)) {
      return {
        twoFactorRequired: true,
        session: await this.sessions.create(user.id, { pendingTwoFactor: true }),
      };
    }

    return { user: toPublicUser(user), session: await this.sessions.create(user.id) };
  }

  // Second stage of a 2FA login. The pending session (from the cookie) proves
  // the password was right, the code proves the user has their app.
  async verifyTwoFactor(pendingToken: string, code: string): Promise<AuthResult> {
    const pending = await this.sessions.findPending(pendingToken);
    if (!pending) {
      throw new AppError(
        'UNAUTHORIZED',
        'Your login session expired, please log in again',
        401,
      );
    }
    await this.twoFactor.verifyLoginCode(pending.userId, code);

    // Replaces the pending session by a real one with a NEW token.
    const { userId, ...session } = await this.sessions.promote(pendingToken);
    const user = await this.users.findById(userId);
    if (!user) throw new AppError('UNAUTHORIZED', 'Please log in again', 401);
    return { user: toPublicUser(user), session };
  }

  // Start turning 2FA on: returns the QR code to scan.
  async setupTwoFactor(userId: string): Promise<{ qr: string; secret: string }> {
    const user = await this.users.findById(userId);
    if (!user) throw new AppError('UNAUTHORIZED', 'Please log in', 401);
    return this.twoFactor.setup(userId, user.email);
  }

  enableTwoFactor(userId: string, code: string): Promise<string[]> {
    return this.twoFactor.enable(userId, code);
  }

  regenerateBackupCodes(userId: string, code: string): Promise<string[]> {
    return this.twoFactor.regenerateBackupCodes(userId, code);
  }

  backupCodesRemaining(userId: string): Promise<number> {
    return this.twoFactor.backupCodesRemaining(userId);
  }

  disableTwoFactor(userId: string, code: string): Promise<void> {
    return this.twoFactor.disable(userId, code);
  }

  // Stores the hash of a fresh 6-digit code on the user and emails the code.
  async sendVerification(userId: string): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user || user.emailVerifiedAt) return;
    const { code, hash, expiresAt } = newVerificationCode(user.id);
    await this.users.update(user.id, {
      emailVerifyHash: hash,
      emailVerifyExpiresAt: expiresAt,
      emailVerifyAttempts: 0,
    });
    await this.mail.sendVerification(user.email, code);
  }

  // The emailed code marks the email as verified; it works once, for 15
  // minutes, and dies after MAX_ATTEMPTS wrong guesses. Every failure gives the
  // same answer, so it does not reveal which emails exist.
  async verifyEmail(email: string, code: string): Promise<void> {
    const invalid = new AppError(
      'INVALID_VERIFICATION_CODE',
      'This code is wrong or expired',
      400,
    );
    const user = await this.users.findByEmail(email);
    if (!user || user.emailVerifiedAt) throw invalid;
    const result = checkCode(
      {
        hash: user.emailVerifyHash,
        expiresAt: user.emailVerifyExpiresAt,
        attempts: user.emailVerifyAttempts,
      },
      user.id,
      code,
    );
    if (result !== 'ok') {
      if (result === 'wrong') {
        await this.users.update(user.id, { emailVerifyAttempts: user.emailVerifyAttempts + 1 });
      }
      throw invalid;
    }
    await this.users.update(user.id, {
      emailVerifiedAt: new Date(),
      emailVerifyHash: null,
      emailVerifyExpiresAt: null,
      emailVerifyAttempts: 0,
    });
  }

  // "Send me a new code". Always succeeds from the outside, so it cannot be
  // used to find out which emails are registered.
  async resendVerification(email: string): Promise<void> {
    const user = await this.users.findByEmail(email);
    if (!user || user.emailVerifiedAt || user.isBot) return;
    await this.sendVerification(user.id).catch((e) =>
      this.log.warn(`Verification email failed: ${String(e)}`),
    );
  }

  // Forgot password, step 1: emails a 6-digit code. Always succeeds from the
  // outside, so it cannot be used to find out which emails are registered.
  // Unverified accounts get nothing (they must verify first), nor do accounts
  // with no password (bots, OAuth).
  async forgotPassword(email: string): Promise<void> {
    const user = await this.users.findByEmail(email);
    if (!user || !user.emailVerifiedAt || !user.passwordHash) {
      // Silent for the client (no email enumeration), but the operator can see why.
      this.log.log(
        `Password reset skipped: ${!user ? 'no such account' : !user.emailVerifiedAt ? 'email not verified' : 'no password'}`,
      );
      return;
    }
    const { code, hash, expiresAt } = newVerificationCode(user.id);
    await this.users.update(user.id, {
      passwordResetHash: hash,
      passwordResetExpiresAt: expiresAt,
      passwordResetAttempts: 0,
    });
    await this.mail
      .sendPasswordReset(user.email, code)
      .then(() => this.log.log('Password reset code sent'))
      .catch((e) => this.log.warn(`Password reset email failed: ${String(e)}`));
  }

  // Step 2: the code plus the new password. Same limits as the email
  // verification code. Afterwards every existing login is ended, so whoever
  // had access with the old password is out.
  async resetPassword(email: string, code: string, password: string): Promise<void> {
    const invalid = new AppError('INVALID_RESET_CODE', 'This code is wrong or expired', 400);
    const user = await this.users.findByEmail(email);
    if (!user) throw invalid;
    const result = checkCode(
      {
        hash: user.passwordResetHash,
        expiresAt: user.passwordResetExpiresAt,
        attempts: user.passwordResetAttempts,
      },
      user.id,
      code,
    );
    if (result !== 'ok') {
      if (result === 'wrong') {
        await this.users.update(user.id, { passwordResetAttempts: user.passwordResetAttempts + 1 });
      }
      throw invalid;
    }
    await this.users.update(user.id, {
      passwordHash: await argon2.hash(password),
      passwordResetHash: null,
      passwordResetExpiresAt: null,
      passwordResetAttempts: 0,
    });
    await this.sessions.revokeAll(user.id);
  }

  // Ends the login behind this cookie, immediately. Works with no cookie too.
  async logout(sessionToken: string | undefined): Promise<void> {
    if (sessionToken) await this.sessions.revoke(sessionToken);
  }

  // "Who am I": the user behind the session cookie, or null when nobody is
  // logged in (no cookie, an unknown or expired session, a pending 2FA
  // session, a deleted account). Not being logged in is a NORMAL answer here,
  // not an error: answering 401 would make the browser print an error in its
  // console on every visit by a logged-out user.
  async currentUser(sessionToken: string | undefined): Promise<PublicUser | null> {
    if (!sessionToken) return null;
    const session = await this.sessions.findActive(sessionToken);
    if (!session) return null;
    const user = await this.users.findById(session.userId);
    return user ? toPublicUser(user) : null;
  }

  // Postgres error code 23505 = unique_violation. Its `detail` names the
  // column, for example: Key (email)=(a@x.com) already exists.
  private translateUniqueViolation(error: unknown): AppError | null {
    if (!(error instanceof QueryFailedError)) return null;
    const driverError = error.driverError as { code?: string; detail?: string };
    if (driverError.code !== '23505') return null;
    if (driverError.detail?.includes('(email)')) {
      return new AppError('EMAIL_TAKEN', 'This email is already registered', 409);
    }
    if (driverError.detail?.includes('(display_name)')) {
      return new AppError(
        'DISPLAY_NAME_TAKEN',
        'This display name is already taken',
        409,
      );
    }
    return null;
  }
}
