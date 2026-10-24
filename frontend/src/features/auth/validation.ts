import type { ValidationKey } from '@/lib/validation';

// Client-side checks that mirror the backend DTOs (SignupDto, LoginDto,
// TwoFactorCodeDto, TwoFactorOrBackupCodeDto), so most mistakes are caught
// before a request is sent.

export const DISPLAY_NAME_MIN = 3;
export const DISPLAY_NAME_MAX = 20;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;
const EMAIL_MAX = 254;
const EMAIL_LOCAL_MAX = 64;
const EMAIL_LABEL_MAX = 63;

export const DISPLAY_NAME_PATTERN = /^[\p{L}\p{N}_-]+$/u;

// An email is checked in three parts, with the same rules as the backend's
// IsEmail (validator.js): "local@domain".
// - local part: pieces of letters, digits and these symbols, joined by single
//   dots (so no leading, trailing or double dot);
// - domain: labels joined by dots, each made of letters, digits and hyphens
//   but not starting or ending with a hyphen;
// - the last label (the "tld") is at least 2 letters, like "com" or "fr".
const EMAIL_LOCAL_PATTERN = /^[\p{L}\p{N}!#$%&'*+/=?^_`{|}~-]+(\.[\p{L}\p{N}!#$%&'*+/=?^_`{|}~-]+)*$/u;
const EMAIL_LABEL_PATTERN = /^[\p{L}\p{N}]([\p{L}\p{N}-]*[\p{L}\p{N}])?$/u;
const EMAIL_TLD_PATTERN = /^(\p{L}{2,}|xn--[a-z0-9-]{2,})$/iu;

export type { ValidationKey };

/**
 * Length the way the backend counts it: one emoji is one character. (The
 * string's own `.length` counts it as two, so "😀😀😀😀" would pass as 8.)
 */
function lengthOf(value: string): number {
  return [...value].length;
}

function isEmail(email: string): boolean {
  const at = email.lastIndexOf('@');
  if (at < 1 || lengthOf(email) > EMAIL_MAX) return false;
  const local = email.slice(0, at);
  const labels = email.slice(at + 1).split('.');
  if (local.length > EMAIL_LOCAL_MAX || !EMAIL_LOCAL_PATTERN.test(local)) return false;
  if (labels.length < 2 || !EMAIL_TLD_PATTERN.test(labels.at(-1) ?? '')) return false;
  return labels.every((label) => label.length <= EMAIL_LABEL_MAX && EMAIL_LABEL_PATTERN.test(label));
}

export function validateEmail(value: string): ValidationKey | null {
  const email = value.trim();
  if (!email) return 'validation.required';
  return isEmail(email) ? null : 'validation.email';
}

export function validateDisplayName(value: string): ValidationKey | null {
  const name = value.trim();
  if (!name) return 'validation.required';
  if (lengthOf(name) < DISPLAY_NAME_MIN || lengthOf(name) > DISPLAY_NAME_MAX) {
    return 'validation.displayNameLength';
  }
  if (!DISPLAY_NAME_PATTERN.test(name)) return 'validation.displayNameChars';
  return null;
}

export function validateNewPassword(value: string): ValidationKey | null {
  if (!value) return 'validation.required';
  if (lengthOf(value) < PASSWORD_MIN || lengthOf(value) > PASSWORD_MAX) {
    return 'validation.passwordLength';
  }
  return null;
}

/** Login only needs "not empty" and "not absurdly long" (what the backend checks); the server decides if it is right. */
export function validateLoginPassword(value: string): ValidationKey | null {
  if (!value) return 'validation.required';
  return lengthOf(value) > PASSWORD_MAX ? 'validation.passwordTooLong' : null;
}

export function validatePasswordConfirmation(password: string, confirmation: string): ValidationKey | null {
  if (!confirmation) return 'validation.required';
  return password === confirmation ? null : 'validation.passwordMismatch';
}

/** Authenticator apps often show "123 456": spaces are ignored. */
export function normalizeCode(value: string): string {
  return value.replace(/\s+/g, '');
}

export function validateCode(value: string): ValidationKey | null {
  const code = normalizeCode(value);
  if (!code) return 'validation.required';
  return /^\d{6}$/.test(code) ? null : 'validation.code';
}

/** A one-time backup code, like "ABCDE-FGHJK": the backend accepts small letters and no dash too. */
const BACKUP_CODE_PATTERN = /^[0-9a-z]{5}-?[0-9a-z]{5}$/i;

/** To log in or to turn 2FA off: the 6 digits from the app, or one of the backup codes (TwoFactorOrBackupCodeDto). */
export function validateCodeOrBackupCode(value: string): ValidationKey | null {
  const code = normalizeCode(value);
  if (!code) return 'validation.required';
  return /^\d{6}$/.test(code) || BACKUP_CODE_PATTERN.test(code) ? null : 'validation.codeOrBackupCode';
}
