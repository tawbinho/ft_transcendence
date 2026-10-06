import { createHash, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { AppError } from '../../common/errors/app-error.js';
import type { Env } from '../../config/env.validation.js';
import { Session } from './entities/session.entity.js';

// What the controller needs to build the cookie.
export interface IssuedSession {
  token: string; // the random value that goes in the cookie (never stored)
  expiresAt: Date;
}

// A pending session (password right, 2FA code not given yet) only has to
// survive until the user types their code.
const PENDING_TTL_MS = 5 * 60 * 1000;

// WHY THIS FILE EXISTS
// All the logic of "who is logged in" lives here. A login is a row in the
// `sessions` table; the browser holds a random token in an httpOnly cookie
// and the table holds only the SHA-256 hash of that token.
@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session) private readonly sessions: Repository<Session>,
    private readonly config: ConfigService<Env, true>,
  ) {}

  // Creates a login for a user. With `pendingTwoFactor` it is the short-lived
  // "password OK, code still needed" state, not a real login yet.
  async create(
    userId: string,
    options: { pendingTwoFactor?: boolean } = {},
  ): Promise<IssuedSession> {
    // Housekeeping: drop every expired session, so the table does not grow
    // forever. Done here because creating a session is a rare event.
    await this.sessions.delete({ expiresAt: LessThan(new Date()) });

    const pendingTwoFactor = options.pendingTwoFactor ?? false;
    const lifetimeMs = pendingTwoFactor
      ? PENDING_TTL_MS
      : this.config.get('SESSION_TTL_DAYS', { infer: true }) * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + lifetimeMs);

    // 32 random bytes = 256 bits: impossible to guess.
    const token = randomBytes(32).toString('base64url');
    await this.sessions.save(
      this.sessions.create({
        userId,
        tokenHash: this.hash(token),
        pendingTwoFactor,
        expiresAt,
      }),
    );
    return { token, expiresAt };
  }

  // The session behind a cookie, but ONLY if it is a real login that has not
  // expired. A pending 2FA session never counts: it must not open normal routes.
  findActive(token: string): Promise<Session | null> {
    return this.sessions.findOneBy({
      tokenHash: this.hash(token),
      pendingTwoFactor: false,
      expiresAt: MoreThan(new Date()),
    });
  }

  // Only used by the 2FA verification route.
  findPending(token: string): Promise<Session | null> {
    return this.sessions.findOneBy({
      tokenHash: this.hash(token),
      pendingTwoFactor: true,
      expiresAt: MoreThan(new Date()),
    });
  }

  // Logout: the login ends immediately, on this device. Safe to call with an
  // unknown or missing token.
  async revoke(token: string): Promise<void> {
    await this.sessions.delete({ tokenHash: this.hash(token) });
  }

  // 2FA code accepted: replace the pending session by a brand-new full one.
  // The token CHANGES when privileges change, so a token an attacker may have
  // seen earlier (session fixation) never becomes a real login. The delete is
  // atomic, so one pending session can only be promoted once.
  async promote(pendingToken: string): Promise<{ userId: string } & IssuedSession> {
    const pending = await this.findPending(pendingToken);
    if (!pending) throw this.expired();

    const removed = await this.sessions.delete({ id: pending.id });
    if (removed.affected === 0) throw this.expired();

    return { userId: pending.userId, ...(await this.create(pending.userId)) };
  }

  // SHA-256 is enough here (unlike passwords): the token is 256 bits of
  // randomness, so it cannot be brute-forced and needs no slow hash.
  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private expired(): AppError {
    return new AppError(
      'UNAUTHORIZED',
      'Your login session expired, please log in again',
      401,
    );
  }
}
