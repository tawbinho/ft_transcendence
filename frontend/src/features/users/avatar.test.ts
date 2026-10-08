import { AVATAR_SOURCE_MAX_BYTES, validateAvatarFile } from './avatar';

describe('validateAvatarFile', () => {
  it('accepts PNG, JPEG and WebP pictures', () => {
    for (const type of ['image/png', 'image/jpeg', 'image/webp']) {
      expect(validateAvatarFile({ type, size: 50_000 })).toBeNull();
    }
  });

  it('refuses other kinds of files', () => {
    expect(validateAvatarFile({ type: 'image/gif', size: 50_000 })).toBe('validation.avatarType');
    expect(validateAvatarFile({ type: 'text/plain', size: 10 })).toBe('validation.avatarType');
    expect(validateAvatarFile({ type: '', size: 10 })).toBe('validation.avatarType');
  });

  it('refuses huge files before opening them', () => {
    expect(validateAvatarFile({ type: 'image/png', size: AVATAR_SOURCE_MAX_BYTES })).toBeNull();
    expect(validateAvatarFile({ type: 'image/png', size: AVATAR_SOURCE_MAX_BYTES + 1 })).toBe('validation.avatarSize');
  });
});
