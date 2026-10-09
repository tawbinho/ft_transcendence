import { readMatchId, readSessionToken } from './session-cookie.js';

describe('readSessionToken', () => {
  it('finds the session among other cookies', () => {
    expect(readSessionToken('a=1; session=abc_DEF-123; b=2')).toBe('abc_DEF-123');
  });

  it('works when it is the only cookie', () => {
    expect(readSessionToken('session=tok')).toBe('tok');
  });

  it('does not confuse a cookie that merely ends with the name', () => {
    expect(readSessionToken('mysession=evil')).toBeNull();
  });

  it('gives null without a header, with an empty value or a broken escape', () => {
    expect(readSessionToken(undefined)).toBeNull();
    expect(readSessionToken('')).toBeNull();
    expect(readSessionToken('session=')).toBeNull();
    expect(readSessionToken('session=%E0%A4%A')).toBeNull();
  });
});

describe('readMatchId', () => {
  const id = '2082b753-ec3c-480d-9ebb-edcfdb5ce293';

  it('accepts { matchId } with a uuid', () => {
    expect(readMatchId({ matchId: id })).toBe(id);
  });

  it('ignores anything else a client may send', () => {
    for (const bad of [null, undefined, 'x', 42, {}, { matchId: 5 }, { matchId: 'nope' }, { matchId: `${id}; drop` }]) {
      expect(readMatchId(bad)).toBeNull();
    }
  });
});
