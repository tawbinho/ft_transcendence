import { createHmac, randomInt } from 'node:crypto';

// The pure rules of 2FA backup codes: what a code looks like, how a typed code
// is cleaned up, how it is stored. No database, no Nest, easy to test.

// 10 characters from 31: no 0, 1, I, L or O, which are easy to confuse when
// copying a code from paper. 31^10 is about 8 * 10^14 (almost 50 bits).
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const CODE_LENGTH = 10;

export const BACKUP_CODE_COUNT = 10;

// A random code. randomInt picks each character uniformly (a plain
// `Math.random() * 31` would be predictable and slightly biased).
export function generateCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return code;
}

// What the user sees and copies: "ABCDE-FGHJK".
export function formatCode(code: string): string {
  return `${code.slice(0, 5)}-${code.slice(5)}`;
}

// Cleans up what the user typed: no spaces or hyphens, capitals.
export function normalizeCode(input: string): string | null {
  const code = input.replace(/[\s-]/g, '').toUpperCase();
  if (code.length !== CODE_LENGTH) return null;
  for (const character of code) {
    if (!ALPHABET.includes(character)) return null;
  }
  return code;
}

// Is this typed value meant as a backup code rather than a 6-digit app code?
// (A 6-digit app code is only digits and 6 long; a backup code is 10 long.)
export function looksLikeBackupCode(input: string): boolean {
  return input.replace(/[\s-]/g, '').length === CODE_LENGTH;
}

// What is stored: HMAC-SHA256 of the code with the server's secret key.
export function hashCode(code: string, key: Buffer): string {
  return createHmac('sha256', key).update(code).digest('hex');
}
