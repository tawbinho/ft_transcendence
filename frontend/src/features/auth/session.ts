import type { User } from './types';

/**
 * What the app knows about the person, from the answer of `/auth/me`:
 * - loading: no answer yet;
 * - member: logged in (a user kept from earlier counts, even if a later request failed);
 * - visitor: the server says nobody is logged in;
 * - failed: no answer and no user kept, so the app cannot tell a visitor from a member.
 */
export type Session =
  { status: 'loading' } | { status: 'visitor' } | { status: 'failed' } | { status: 'member'; user: User };

export function sessionOf(data: User | null | undefined, isPending: boolean): Session {
  if (data) return { status: 'member', user: data };
  if (data === null) return { status: 'visitor' };
  return { status: isPending ? 'loading' : 'failed' };
}
