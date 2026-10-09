import { NAV_ITEMS, hasAnyCount, menuItems, navItemsFor, sectionForPath } from './nav';

const labelsActiveOn = (pathname: string) =>
  NAV_ITEMS.filter((item) => item.isActive(pathname)).map((item) => item.label);

describe('which links a person sees', () => {
  it('shows a visitor Play, Tournaments, Watch and Players', () => {
    expect(navItemsFor(false).map((item) => item.label)).toEqual([
      'nav.play',
      'nav.tournaments',
      'nav.watch',
      'nav.players',
    ]);
  });

  it('shows a member every link', () => {
    expect(navItemsFor(true)).toHaveLength(NAV_ITEMS.length);
  });

  it('marks the pages that need an account', () => {
    const open = NAV_ITEMS.filter((item) => !item.needsAccount).map((item) => item.label);
    expect(open).toEqual(['nav.play', 'nav.tournaments']);
  });

  it('gives each count to chat and friends only', () => {
    const counted = NAV_ITEMS.filter((item) => item.count).map((item) => [item.label, item.count]);
    expect(counted).toEqual([
      ['nav.chat', 'chat'],
      ['nav.friends', 'friends'],
    ]);
  });
});

describe('which link is highlighted', () => {
  it.each([
    ['/play', 'nav.play'],
    ['/play/local', 'nav.play'],
    ['/play/online', 'nav.play'],
    ['/matches/0b2d7a0e', 'nav.play'],
    ['/tournaments', 'nav.tournaments'],
    ['/tournaments/local', 'nav.tournaments'],
    ['/watch', 'nav.watch'],
    ['/watch/0b2d7a0e', 'nav.watch'],
    ['/players', 'nav.players'],
    ['/leaderboard', 'nav.players'],
    ['/users/bob', 'nav.players'],
    ['/matches', 'nav.history'],
    ['/chat', 'nav.chat'],
    ['/chat/bob', 'nav.chat'],
    ['/friends', 'nav.friends'],
  ])('%s highlights %s only', (pathname, label) => {
    expect(labelsActiveOn(pathname)).toEqual([label]);
  });

  it.each(['/', '/login', '/settings', '/settings/security', '/privacy', '/playground', '/matchesx'])(
    'highlights nothing on %s',
    (pathname) => {
      expect(labelsActiveOn(pathname)).toEqual([]);
    },
  );
});

describe('sectionForPath', () => {
  it('names the section of a members page', () => {
    expect(sectionForPath('/watch')).toBe('nav.watch');
    expect(sectionForPath('/matches')).toBe('nav.history');
  });

  it('is null for pages that are not a section', () => {
    expect(sectionForPath('/settings')).toBeNull();
    expect(sectionForPath('/')).toBeNull();
  });
});

describe('hasAnyCount', () => {
  it('is true when chat or friends has a number', () => {
    expect(hasAnyCount({ chat: 0, friends: 0 })).toBe(false);
    expect(hasAnyCount({ chat: 2, friends: 0 })).toBe(true);
    expect(hasAnyCount({ chat: 0, friends: 1 })).toBe(true);
  });
});

describe('the phone menu groups', () => {
  const labels = (group: 'play' | 'community' | 'you', isMember: boolean) =>
    menuItems(group, isMember).map((item) => item.label);

  it('lists Play, Tournaments and Watch under Play', () => {
    expect(labels('play', true)).toEqual(['nav.play', 'nav.tournaments', 'nav.watch']);
  });

  it('lists Players, Friends and Chat under Community for a member', () => {
    expect(labels('community', true)).toEqual(['nav.players', 'nav.friends', 'nav.chat']);
  });

  it('shows a visitor only the links a visitor may see', () => {
    expect(labels('play', false)).toEqual(['nav.play', 'nav.tournaments', 'nav.watch']);
    expect(labels('community', false)).toEqual(['nav.players']);
    expect(labels('you', false)).toEqual([]);
  });

  it('puts History under You', () => {
    expect(labels('you', true)).toEqual(['nav.history']);
  });
});
