import { createHash, randomInt, timingSafeEqual } from 'node:crypto';

const CODE_TTL_MS = 15 * 60 * 1000;
// A 6-digit code has only a million values, so a code dies after this many
// wrong guesses (the user must ask for a new one).
export const MAX_ATTEMPTS = 5;

// Includes the user id, so two users with the same code get different hashes.
export const hashCode = (userId: string, code: string): string =>
  createHash('sha256').update(`${userId}:${code}`).digest('hex');

// The code goes in the email; only its hash is stored, like sessions.
export function newVerificationCode(userId: string): {
  code: string;
  hash: string;
  expiresAt: Date;
} {
  const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
  return { code, hash: hashCode(userId, code), expiresAt: new Date(Date.now() + CODE_TTL_MS) };
}

// 'wrong' = a bad guess (the caller counts it); 'invalid' = nothing to guess
// (no code, expired, or locked after MAX_ATTEMPTS).
export function checkCode(
  stored: { hash: string | null; expiresAt: Date | null; attempts: number },
  userId: string,
  code: string,
): 'ok' | 'wrong' | 'invalid' {
  if (
    !stored.hash ||
    !stored.expiresAt ||
    stored.expiresAt < new Date() ||
    stored.attempts >= MAX_ATTEMPTS
  ) {
    return 'invalid';
  }
  const given = Buffer.from(hashCode(userId, code));
  const expected = Buffer.from(stored.hash);
  return given.length === expected.length && timingSafeEqual(given, expected) ? 'ok' : 'wrong';
}
