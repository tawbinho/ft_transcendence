import type { User } from '@/features/auth/types';
import type { PlayerListItem } from '@/features/users/types';
import { http, sendOverNetwork, setTransport } from '@/lib/api/http';
import type { Page } from '@/lib/api/types';
import { installDemoServer, resetDemoData } from '.';

const me: User = { id: 'me', email: 'me@example.com', displayName: 'tester', avatarUrl: null, locale: 'en' };

const json = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } });

describe('demo server', () => {
  afterEach(() => {
    resetDemoData();
    setTransport(sendOverNetwork);
    vi.unstubAllGlobals();
  });

  it('answers demo routes in the browser; only the session check goes to the backend', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => json(200, { data: me }));
    vi.stubGlobal('fetch', fetch);
    installDemoServer(new Set(['users']));

    const page = await http.get<Page<PlayerListItem>>('/users', { query: { search: 'lina' } });
    expect(page.items.map((player) => player.displayName)).toEqual(['lina']);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0]?.[0]).toBe('/api/auth/me');
  });

  it('lists the viewer among the players, with the results of their real matches', async () => {
    const won = {
      id: 'm1',
      status: 'finished',
      endReason: 'win',
      settings: { cols: 7, rows: 6, winLength: 4, theme: 'classic' },
      createdAt: '2026-10-08T10:00:00.000Z',
      endedAt: '2026-10-08T10:10:00.000Z',
      players: [
        { seat: 1, userId: 'me', displayName: 'tester', result: 'win' },
        { seat: 2, userId: 'u2', displayName: 'bob', result: 'loss' },
      ],
      yourSeat: 1,
      winnerSeat: 1,
      moveCount: 7,
    };
    vi.stubGlobal('fetch', async (url: string) =>
      url.startsWith('/api/matches/mine')
        ? json(200, { data: { items: [won], total: 1, limit: 50, offset: 0 } })
        : json(200, { data: me }),
    );
    installDemoServer(new Set(['users']));

    const page = await http.get<Page<PlayerListItem>>('/users', { query: { search: 'tester' } });
    expect(page.items).toMatchObject([
      { id: 'me', friendship: 'self', online: true, stats: { played: 1, wins: 1, losses: 0, draws: 0 } },
    ]);
    const friends = await http.get<Page<PlayerListItem>>('/users', { query: { search: 'tester', friends: true } });
    expect(friends.items).toEqual([]);
  });

  it('passes a backend failure on instead of treating it as a logout', async () => {
    vi.stubGlobal('fetch', async () => json(429, { error: { code: 'RATE_LIMITED', message: 'Too many attempts' } }));
    installDemoServer(new Set(['chat']));

    await expect(http.get('/chat/conversations')).rejects.toMatchObject({ code: 'RATE_LIMITED', status: 429 });
  });

  it('leaves the routes of other features to the backend', async () => {
    const empty = { items: [], total: 0, limit: 20, offset: 0 };
    const fetch = vi.fn<typeof globalThis.fetch>(async () => json(200, { data: empty }));
    vi.stubGlobal('fetch', fetch);
    installDemoServer(new Set(['chat']));

    await http.get('/users');
    expect(fetch.mock.calls.map((call) => call[0])).toEqual(['/api/users']);
  });
});
