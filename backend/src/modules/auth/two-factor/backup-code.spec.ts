import {
  BACKUP_CODE_COUNT,
  formatCode,
  generateCode,
  hashCode,
  looksLikeBackupCode,
  normalizeCode,
} from './backup-code.js';

const KEY = Buffer.alloc(32, 7);

describe('generateCode', () => {
  it('is 10 characters from the unambiguous alphabet', () => {
    for (let i = 0; i < 200; i++) {
      expect(generateCode()).toMatch(/^[2-9A-HJKMNP-Z]{10}$/);
    }
  });

  it('never contains the confusing characters 0, 1, I, L, O', () => {
    const all = Array.from({ length: 500 }, generateCode).join('');
    expect(all).not.toMatch(/[01ILO]/);
  });

  it('does not repeat (50 bits of randomness)', () => {
    const codes = new Set(Array.from({ length: 1000 }, generateCode));
    expect(codes.size).toBe(1000);
  });

  it('a list holds 10 codes', () => {
    expect(BACKUP_CODE_COUNT).toBe(10);
  });
});

describe('formatCode and normalizeCode', () => {
  it('shows a code as two groups of five', () => {
    expect(formatCode('ABCDEFGHJK')).toBe('ABCDE-FGHJK');
  });

  it('cleans up what a person types: spaces, hyphens, lower case', () => {
    expect(normalizeCode('abcde-fghjk')).toBe('ABCDEFGHJK');
    expect(normalizeCode(' ABCDE FGHJK ')).toBe('ABCDEFGHJK');
    expect(normalizeCode('ABCDEFGHJK')).toBe('ABCDEFGHJK');
  });

  it('round-trips a formatted code', () => {
    const code = generateCode();
    expect(normalizeCode(formatCode(code))).toBe(code);
  });

  it('refuses what cannot be a backup code', () => {
    expect(normalizeCode('')).toBeNull();
    expect(normalizeCode('ABCDE')).toBeNull(); // too short
    expect(normalizeCode('ABCDEFGHJKM')).toBeNull(); // too long
    expect(normalizeCode('ABCDE-FGHJ0')).toBeNull(); // 0 is not in the alphabet
    expect(normalizeCode('ABCDE-FGHJ!')).toBeNull();
    expect(normalizeCode('123456')).toBeNull(); // an app code
  });
});

describe('looksLikeBackupCode', () => {
  it('tells a backup code from a 6-digit app code by its length', () => {
    expect(looksLikeBackupCode('123456')).toBe(false);
    expect(looksLikeBackupCode('123 456')).toBe(false);
    expect(looksLikeBackupCode('ABCDE-FGHJK')).toBe(true);
    expect(looksLikeBackupCode('abcdefghjk')).toBe(true);
  });
});

describe('hashCode', () => {
  it('is stable for the same code and key', () => {
    expect(hashCode('ABCDEFGHJK', KEY)).toBe(hashCode('ABCDEFGHJK', KEY));
  });

  it('differs between codes and between keys', () => {
    expect(hashCode('ABCDEFGHJK', KEY)).not.toBe(hashCode('ABCDEFGHJM', KEY));
    expect(hashCode('ABCDEFGHJK', KEY)).not.toBe(hashCode('ABCDEFGHJK', Buffer.alloc(32, 8)));
  });

  it('does not contain the code', () => {
    expect(hashCode('ABCDEFGHJK', KEY)).toMatch(/^[0-9a-f]{64}$/);
  });
});
