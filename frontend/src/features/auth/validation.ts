import type { ValidationKey } from '@/lib/validation';

// Client-side checks that mirror the backend DTOs (SignupDto, LoginDto,
// TwoFactorCodeDto), so most mistakes are caught before a request is sent.
// The backend still validates everything; these only improve feedback.
// Each function returns a translation key, or null when the value is valid.

export const DISPLAY_NAME_MIN = 3;
export const DISPLAY_NAME_MAX = 20;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;
const EMAIL_MAX = 254;

export const DISPLAY_NAME_PATTERN = /^[\p{L}\p{N}_-]+$/u;
// Same idea as class-validator's IsEmail, kept deliberately simple.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type { ValidationKey };

export function validateEmail(value: string): ValidationKey | null {
  const email = value.trim();
  if (!email) return 'validation.required';
  if (email.length > EMAIL_MAX || !EMAIL_PATTERN.test(email)) return 'validation.email';
  return null;
}

export function validateDisplayName(value: string): ValidationKey | null {
  const name = value.trim();
  if (!name) return 'validation.required';
  if (name.length < DISPLAY_NAME_MIN || name.length > DISPLAY_NAME_MAX) {
    return 'validation.displayNameLength';
  }
  if (!DISPLAY_NAME_PATTERN.test(name)) return 'validation.displayNameChars';
  return null;
}

export function validateNewPassword(value: string): ValidationKey | null {
  if (!value) return 'validation.required';
  if (value.length < PASSWORD_MIN || value.length > PASSWORD_MAX) {
    return 'validation.passwordLength';
  }
  return null;
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
