import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { AppError } from '../../common/errors/app-error.js';
import type { Env } from '../../config/env.validation.js';
import { RefreshToken } from './entities/refresh-token.entity.js';

// What is inside the access JWT. `sub` ("subject") is the user id.
export interface AccessTokenPayload {
  sub: string;
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

// WHY THIS FILE EXISTS
// All token handling in one place.
//  - ACCESS token: a short-lived JWT (15 min). Checking it needs no database.
//  - REFRESH token: a random string, long-lived (7 days), stored HASHED in the
//    refresh_tokens table so the server can revoke it. Its only use is to get
//    a new pair of tokens.
@Injectable()
export class TokensService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokens: Repository<RefreshToken>,
  ) {}

  // Creates a new pair of tokens for a user. `familyId` is given when
  // rotating, so the new token stays in the same family as the old one.
  async issue(userId: string, familyId: string = randomUUID()): Promise<IssuedTokens> {
    const payload: AccessTokenPayload = { sub: userId };
    const accessToken = await this.jwt.signAsync(payload);

    // 32 random bytes = 256 bits: impossible to guess.
    const refreshToken = randomBytes(32).toString('base64url');
    const ttlDays = this.config.get('JWT_REFRESH_TTL_DAYS', { infer: true });
    const refreshExpiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    await this.refreshTokens.save(
      this.refreshTokens.create({
        userId,
        tokenHash: this.hash(refreshToken),
        familyId,
        expiresAt: refreshExpiresAt,
        revokedAt: null,
      }),
    );

    return { accessToken, refreshToken, refreshExpiresAt };
  }

  // Checks an access token and returns who it belongs to. The signature and
  // expiry are verified; a forged, altered or expired token throws.
  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    try {
      return await this.jwt.verifyAsync<AccessTokenPayload>(token);
    } catch {
      throw new AppError('UNAUTHORIZED', 'Invalid or expired access token', 401);
    }
  }

  // Exchanges a refresh token for a brand new pair. Every refresh token is
  // SINGLE USE: using it revokes it and issues the next one in the same family.
  async rotate(refreshToken: string): Promise<IssuedTokens & { userId: string }> {
    const stored = await this.refreshTokens.findOneBy({
      tokenHash: this.hash(refreshToken),
    });
    if (!stored) throw this.invalidRefresh();

    // Revoke atomically: the WHERE clause only matches a token that is not
    // revoked yet, so two simultaneous requests cannot both succeed.
    const result = await this.refreshTokens.update(
      { id: stored.id, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );

    if (result.affected === 0) {
      // The token was ALREADY used or revoked, yet someone presents it again.
      // It was probably stolen: kill every token of this login (the family).
      await this.revokeFamily(stored.familyId);
      throw this.invalidRefresh();
    }

    if (stored.expiresAt.getTime() <= Date.now()) throw this.invalidRefresh();

    const issued = await this.issue(stored.userId, stored.familyId);
    return { ...issued, userId: stored.userId };
  }

  // Logout: revoke this token's whole family, so no further token of this
  // login can be obtained. Safe to call with an unknown or missing token.
  async revoke(refreshToken: string): Promise<void> {
    const stored = await this.refreshTokens.findOneBy({
      tokenHash: this.hash(refreshToken),
    });
    if (stored) await this.revokeFamily(stored.familyId);
  }

  private async revokeFamily(familyId: string): Promise<void> {
    await this.refreshTokens.update(
      { familyId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  // SHA-256 is enough here (unlike passwords): the token is 256 bits of
  // randomness, so it cannot be brute-forced and needs no slow hash.
  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private invalidRefresh(): AppError {
    return new AppError('INVALID_REFRESH_TOKEN', 'Please log in again', 401);
  }
}
