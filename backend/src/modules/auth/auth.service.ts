import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { QueryFailedError } from 'typeorm';
import { AppError } from '../../common/errors/app-error.js';
import { toPublicUser, type PublicUser } from '../users/public-user.js';
import { UsersService } from '../users/users.service.js';
import type { LoginDto } from './dto/login.dto.js';
import type { SignupDto } from './dto/signup.dto.js';
import { TokensService, type IssuedTokens } from './tokens.service.js';
import { TwoFactorService } from './two-factor/two-factor.service.js';

// What signup, login and refresh return: the user plus the tokens the
// controller puts in cookies.
export interface AuthResult {
  user: PublicUser;
  tokens: IssuedTokens;
}

// Login for a user with 2FA: the password was right, but no session yet.
// `pendingToken` goes in a short-lived cookie and is only good for the 2FA
// verification route.
export interface TwoFactorRequired {
  twoFactorRequired: true;
  pendingToken: string;
}

// WHY THIS FILE EXISTS
// The business rules of authentication live here, not in the controller:
// signup, login, token refresh, logout, and "who am I".
@Injectable()
export class AuthService {
  // A hash of a random password nobody knows. Used to spend the same time
  // verifying when the email does not exist (see login).
  private readonly dummyHash = argon2.hash(randomBytes(16).toString('hex'));

  constructor(
    private readonly users: UsersService,
    private readonly tokens: TokensService,
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
    return { user: toPublicUser(user), tokens: await this.tokens.issue(user.id) };
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

    // Password correct. With 2FA on, that is NOT enough to log in: hand back
    // a short-lived pending token and wait for the code (verifyTwoFactor).
    if (await this.twoFactor.isEnabled(user.id)) {
      return {
        twoFactorRequired: true,
        pendingToken: await this.tokens.issuePending(user.id),
      };
    }

    return { user: toPublicUser(user), tokens: await this.tokens.issue(user.id) };
  }

  // Second stage of a 2FA login: the pending token proves the password was
  // right, the code proves the user has their authenticator app.
  async verifyTwoFactor(pendingToken: string, code: string): Promise<AuthResult> {
    const userId = await this.tokens.verifyPending(pendingToken);
    await this.twoFactor.verifyLoginCode(userId, code);

    const user = await this.users.findById(userId);
    if (!user) throw new AppError('UNAUTHORIZED', 'Please log in again', 401);
    return { user: toPublicUser(user), tokens: await this.tokens.issue(user.id) };
  }

  // Start turning 2FA on: returns the QR code to scan.
  async setupTwoFactor(userId: string): Promise<{ qr: string; secret: string }> {
    const user = await this.users.findById(userId);
    if (!user) throw new AppError('UNAUTHORIZED', 'Please log in', 401);
    return this.twoFactor.setup(userId, user.email);
  }

  enableTwoFactor(userId: string, code: string): Promise<void> {
    return this.twoFactor.enable(userId, code);
  }

  disableTwoFactor(userId: string, code: string): Promise<void> {
    return this.twoFactor.disable(userId, code);
  }

  // Exchanges the refresh token for a new pair (the old one is consumed).
  async refresh(refreshToken: string): Promise<AuthResult> {
    const { userId, ...tokens } = await this.tokens.rotate(refreshToken);
    const user = await this.users.findById(userId);
    if (!user) {
      throw new AppError('INVALID_REFRESH_TOKEN', 'Please log in again', 401);
    }
    return { user: toPublicUser(user), tokens };
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (refreshToken) await this.tokens.revoke(refreshToken);
  }

  // "Who am I": the user behind the access token, or null when nobody is
  // logged in (no cookie, a forged or an expired token, a deleted account).
  // Not being logged in is a NORMAL answer here, not an error: answering 401
  // would make the browser print an error in its console on every visit by
  // a logged-out user. The frontend calls POST /auth/refresh when it gets
  // null but still holds a refresh cookie.
  async currentUser(accessToken: string | undefined): Promise<PublicUser | null> {
    if (!accessToken) return null;
    try {
      const { sub } = await this.tokens.verifyAccessToken(accessToken);
      const user = await this.users.findById(sub);
      return user ? toPublicUser(user) : null;
    } catch (error) {
      if (error instanceof AppError) return null; // invalid or expired token
      throw error;
    }
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
