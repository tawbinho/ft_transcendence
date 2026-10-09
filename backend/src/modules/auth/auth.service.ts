import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { QueryFailedError } from 'typeorm';
import { AppError } from '../../common/errors/app-error.js';
import { toPublicUser, type PublicUser } from '../users/public-user.js';
import { UsersService } from '../users/users.service.js';
import type { LoginDto } from './dto/login.dto.js';
import type { SignupDto } from './dto/signup.dto.js';
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
  ) {}

  async signup(dto: SignupDto): Promise<AuthResult> {
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

    // 4. Signing up also logs the user in.
    return { user: toPublicUser(user), session: await this.sessions.create(user.id) };
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
