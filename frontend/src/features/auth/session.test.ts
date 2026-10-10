import { makeUser } from '@/test/fixtures/users';
import { sessionOf } from './session';

describe('sessionOf', () => {
  it('is a member when there is a user', () => {
    const user = makeUser();
    expect(sessionOf(user, false)).toEqual({ status: 'member', user });
  });

  it('is a visitor when the server says nobody is logged in', () => {
    expect(sessionOf(null, false)).toEqual({ status: 'visitor' });
  });

  it('is loading until the first answer', () => {
    expect(sessionOf(undefined, true)).toEqual({ status: 'loading' });
  });

  it('has failed when the answer never came and no user is kept', () => {
    expect(sessionOf(undefined, false)).toEqual({ status: 'failed' });
  });
});
