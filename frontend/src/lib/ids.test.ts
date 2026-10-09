import { isUuid } from './ids';

describe('isUuid', () => {
  it('accepts a UUID, in lower or upper case', () => {
    expect(isUuid('0b7e5c1e-8f3a-4c52-9d61-2a4e6f8b1c33')).toBe(true);
    expect(isUuid('0B7E5C1E-8F3A-4C52-9D61-2A4E6F8B1C33')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isUuid('')).toBe(false);
    expect(isUuid('not-a-uuid')).toBe(false);
    expect(isUuid('live')).toBe(false);
    expect(isUuid('0b7e5c1e-8f3a-4c52-9d61-2a4e6f8b1c33-extra')).toBe(false);
  });
});
