import {
  normalizeCode,
  validateCode,
  validateDisplayName,
  validateEmail,
  validateNewPassword,
  validatePasswordConfirmation,
} from './validation';

describe('auth validation', () => {
  it('checks emails', () => {
    expect(validateEmail('')).toBe('validation.required');
    expect(validateEmail('nope')).toBe('validation.email');
    expect(validateEmail(' mario@example.com ')).toBeNull();
  });

  it('accepts display names in any alphabet, like the backend', () => {
    expect(validateDisplayName('mario_42')).toBeNull();
    expect(validateDisplayName('علي')).toBeNull();
    expect(validateDisplayName('Zoé-B')).toBeNull();
    expect(validateDisplayName('ab')).toBe('validation.displayNameLength');
    expect(validateDisplayName('a'.repeat(21))).toBe('validation.displayNameLength');
    expect(validateDisplayName('two words')).toBe('validation.displayNameChars');
  });

  it('checks password length and confirmation', () => {
    expect(validateNewPassword('short')).toBe('validation.passwordLength');
    expect(validateNewPassword('long enough')).toBeNull();
    expect(validatePasswordConfirmation('abcdefgh', 'abcdefgx')).toBe('validation.passwordMismatch');
    expect(validatePasswordConfirmation('abcdefgh', 'abcdefgh')).toBeNull();
  });

  it('accepts 6-digit codes with spaces', () => {
    expect(normalizeCode('123 456')).toBe('123456');
    expect(validateCode('123 456')).toBeNull();
    expect(validateCode('12345')).toBe('validation.code');
    expect(validateCode('12345a')).toBe('validation.code');
  });
});
