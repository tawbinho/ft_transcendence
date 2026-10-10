import type { Friend } from '@/features/friends/types';
import { countOnline, onlineFirst } from './friendOrder';

const friend = (displayName: string, online: boolean): Friend => ({
  id: displayName,
  displayName,
  avatarUrl: null,
  online,
  since: '2026-09-01T10:00:00.000Z',
});

describe('friend order', () => {
  const friends = [friend('dora', false), friend('carl', true), friend('anna', false), friend('bob', true)];

  it('puts online friends first, then sorts by name', () => {
    expect(onlineFirst(friends).map((f) => f.displayName)).toEqual(['bob', 'carl', 'anna', 'dora']);
  });

  it('does not change the list it was given', () => {
    const copy = [...friends];
    onlineFirst(friends);
    expect(friends).toEqual(copy);
  });

  it('counts the friends who are online', () => {
    expect(countOnline(friends)).toBe(2);
    expect(countOnline([])).toBe(0);
  });
});
