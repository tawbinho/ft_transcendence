import { MAX_ATTEMPTS, checkCode, hashCode, newVerificationCode } from './verification-code.js';

describe('newVerificationCode', () => {
  it('is 6 digits, and the hash is what gets stored', () => {
    for (let i = 0; i < 200; i++) {
      const { code, hash } = newVerificationCode('user-1');
      expect(code).toMatch(/^\d{6}$/);
      expect(hash).toBe(hashCode('user-1', code));
      expect(hash).not.toContain(code);
    }
  });

  it('keeps leading zeros and varies between calls', () => {
    const codes = new Set(Array.from({ length: 50 }, () => newVerificationCode('u').code));
    expect(codes.size).toBeGreaterThan(40);
  });

  it('the same code gives another hash for another user', () => {
    expect(hashCode('a', '123456')).not.toBe(hashCode('b', '123456'));
  });

  it('expires in about 15 minutes and allows a few attempts', () => {
    const minutes = (newVerificationCode('u').expiresAt.getTime() - Date.now()) / 60_000;
    expect(minutes).toBeGreaterThan(14.9);
    expect(minutes).toBeLessThanOrEqual(15);
    expect(MAX_ATTEMPTS).toBe(5);
  });
});

describe('checkCode', () => {
  const future = new Date(Date.now() + 60_000);
  const make = (code: string) => ({ hash: hashCode('u', code), expiresAt: future, attempts: 0 });

  it('accepts the right code', () => {
    expect(checkCode(make('123456'), 'u', '123456')).toBe('ok');
  });

  it('refuses a wrong code, an expired one, a used one and a locked one', () => {
    expect(checkCode(make('123456'), 'u', '654321')).toBe('wrong');
    expect(checkCode({ ...make('123456'), expiresAt: new Date(Date.now() - 1) }, 'u', '123456')).toBe('invalid');
    expect(checkCode({ hash: null, expiresAt: null, attempts: 0 }, 'u', '123456')).toBe('invalid');
    expect(checkCode({ ...make('123456'), attempts: MAX_ATTEMPTS }, 'u', '123456')).toBe('invalid');
  });
});
