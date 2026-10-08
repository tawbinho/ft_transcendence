import {
  toTournament,
  toTournamentSummary,
  type RegisteredPlayer,
  type TournamentData,
} from './tournament-view.js';

// ---------------------------------------------------------------------------
// Helpers: build the raw rows by hand
// ---------------------------------------------------------------------------

const ALICE = 'user-alice';
const BOB = 'user-bob';
const CAROL = 'user-carol';

function tournament(overrides: Partial<TournamentData> = {}): TournamentData {
  return {
    id: 'tournament-1',
    name: 'Friday cup',
    status: 'registering',
    size: 4,
    cols: 7,
    rows: 6,
    winLength: 4,
    theme: 'classic',
    createdAt: new Date('2026-01-01T10:00:00Z'),
    startedAt: null,
    endedAt: null,
    createdBy: { id: ALICE, displayName: 'alice' },
    winner: null,
    ...overrides,
  };
}

const players: RegisteredPlayer[] = [
  { userId: ALICE, displayName: 'alice', avatarUrl: null },
  { userId: BOB, displayName: 'bob', avatarUrl: '/api/avatars/bob.webp' },
];

// ---------------------------------------------------------------------------

describe('toTournamentSummary', () => {
  it('carries the headline facts', () => {
    const summary = toTournamentSummary(tournament(), 2, true);
    expect(summary).toEqual({
      id: 'tournament-1',
      name: 'Friday cup',
      status: 'registering',
      size: 4,
      playerCount: 2,
      settings: { cols: 7, rows: 6, winLength: 4, theme: 'classic' },
      createdBy: { id: ALICE, displayName: 'alice' },
      createdAt: new Date('2026-01-01T10:00:00Z'),
      winner: null,
      joined: true,
    });
  });

  it('has no players list and no bracket: that is for the detail only', () => {
    const summary = toTournamentSummary(tournament(), 2, false);
    expect(summary).not.toHaveProperty('players');
    expect(summary).not.toHaveProperty('rounds');
  });

  it('reports the winner of a finished tournament', () => {
    const summary = toTournamentSummary(
      tournament({
        status: 'finished',
        winner: { id: BOB, displayName: 'bob' },
      }),
      4,
      false,
    );
    expect(summary.winner).toEqual({ id: BOB, displayName: 'bob' });
  });

  it('does not leak extra fields of the creator', () => {
    const data = tournament({
      createdBy: { id: ALICE, displayName: 'alice', email: 'a@x.com' } as never,
    });
    expect(toTournamentSummary(data, 1, true).createdBy).toEqual({
      id: ALICE,
      displayName: 'alice',
    });
  });
});

describe('toTournament', () => {
  it('lists the players in the order given, with their picture', () => {
    const view = toTournament(tournament(), players, ALICE);
    expect(view.players.map((player) => player.displayName)).toEqual([
      'alice',
      'bob',
    ]);
    expect(view.players[1]!.avatarUrl).toBe('/api/avatars/bob.webp');
    expect(view.playerCount).toBe(2);
  });

  it('says whether the viewer is registered', () => {
    expect(toTournament(tournament(), players, BOB).joined).toBe(true);
    expect(toTournament(tournament(), players, CAROL).joined).toBe(false);
  });

  it('has an empty bracket before the tournament starts', () => {
    expect(toTournament(tournament(), players, ALICE).rounds).toEqual([]);
  });

  it('reports nobody online until presence exists', () => {
    const view = toTournament(tournament(), players, ALICE);
    expect(view.players.every((player) => player.online === false)).toBe(true);
  });

  it('keeps the summary fields too', () => {
    const view = toTournament(tournament(), players, ALICE);
    expect(view.name).toBe('Friday cup');
    expect(view.settings.theme).toBe('classic');
    expect(view.startedAt).toBeNull();
    expect(view.endedAt).toBeNull();
  });

  it('works with no registered players', () => {
    const view = toTournament(tournament(), [], ALICE);
    expect(view.players).toEqual([]);
    expect(view.playerCount).toBe(0);
    expect(view.joined).toBe(false);
  });
});
