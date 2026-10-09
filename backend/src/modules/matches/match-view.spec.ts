import {
  toMatchSummary,
  toMatchView,
  type MatchData,
  type MoveData,
  type PlayerData,
} from './match-view.js';

// ---------------------------------------------------------------------------
// Helpers: build the raw rows by hand
// ---------------------------------------------------------------------------

const ALICE = 'user-alice';
const BOB = 'user-bob';

function match(overrides: Partial<MatchData> = {}): MatchData {
  return {
    id: 'match-1',
    status: 'in_progress',
    endReason: null,
    cols: 7,
    rows: 6,
    winLength: 4,
    theme: 'classic',
    createdAt: new Date('2026-01-01T10:00:00Z'),
    startedAt: new Date('2026-01-01T10:01:00Z'),
    endedAt: null,
    ...overrides,
  };
}

const players = (
  aliceResult: PlayerData['result'] = null,
  bobResult: PlayerData['result'] = null,
): PlayerData[] => [
  { seat: 1, userId: ALICE, displayName: 'alice', result: aliceResult },
  { seat: 2, userId: BOB, displayName: 'bob', result: bobResult },
];

// Turns a list of columns into stored moves (move numbers start at 1).
const moves = (columns: number[]): MoveData[] =>
  columns.map((col, index) => ({ ply: index + 1, col }));

// ---------------------------------------------------------------------------

describe('toMatchView', () => {
  it('shows an empty board for a match nobody has played in yet', () => {
    const view = toMatchView(
      match({ status: 'waiting', startedAt: null }),
      [players()[0]!],
      [],
      ALICE,
    );
    expect(view.game.board).toHaveLength(7);
    expect(view.game.board[0]).toEqual([0, 0, 0, 0, 0, 0]);
    expect(view.game.moveCount).toBe(0);
    expect(view.game.lastMove).toBeNull();
    // Waiting: nobody can move yet.
    expect(view.game.current).toBeNull();
    expect(view.players).toHaveLength(1);
  });

  it('rebuilds the board and the turn from the saved moves', () => {
    // Alice (seat 1) plays column 3, Bob (seat 2) plays column 3 on top.
    const view = toMatchView(match(), players(), moves([3, 3, 4]), BOB);
    expect(view.game.board[3]!.slice(0, 3)).toEqual([1, 2, 0]);
    expect(view.game.board[4]![0]).toBe(1);
    expect(view.game.moveCount).toBe(3);
    expect(view.game.moves).toEqual([3, 3, 4]);
    expect(view.game.lastMove).toEqual({ col: 4, row: 0 });
    // Three discs played, so seat 2 moves next.
    expect(view.game.current).toBe(2);
  });

  it('puts the moves in order even if the rows arrive shuffled', () => {
    const shuffled = [
      { ply: 3, col: 4 },
      { ply: 1, col: 3 },
      { ply: 2, col: 3 },
    ];
    const view = toMatchView(match(), players(), shuffled, ALICE);
    expect(view.game.moves).toEqual([3, 3, 4]);
  });

  it('tells each viewer which seat they have', () => {
    expect(toMatchView(match(), players(), [], ALICE).yourSeat).toBe(1);
    expect(toMatchView(match(), players(), [], BOB).yourSeat).toBe(2);
    expect(
      toMatchView(match(), players(), [], 'someone-else').yourSeat,
    ).toBeNull();
  });

  it('has no seat for a live event, which has no particular viewer', () => {
    expect(toMatchView(match(), players(), [], null).yourSeat).toBeNull();
  });

  it('lists the players in seat order, even if they arrive reversed', () => {
    const view = toMatchView(match(), players().reverse(), [], ALICE);
    expect(view.players.map((p) => p.seat)).toEqual([1, 2]);
    expect(view.players.map((p) => p.displayName)).toEqual(['alice', 'bob']);
  });

  it('reports a win: winner from the results, line from the board', () => {
    // Alice connects four on the bottom row.
    const view = toMatchView(
      match({ status: 'finished', endReason: 'win', endedAt: new Date() }),
      players('win', 'loss'),
      moves([0, 0, 1, 1, 2, 2, 3]),
      ALICE,
    );
    expect(view.winnerSeat).toBe(1);
    expect(view.game.winningLine).toHaveLength(4);
    // Finished: nobody's turn.
    expect(view.game.current).toBeNull();
  });

  it('reports a resignation: a winner but NO connected line on the board', () => {
    // Alice resigned after a few moves, so Bob wins without connecting four.
    const view = toMatchView(
      match({ status: 'finished', endReason: 'resign', endedAt: new Date() }),
      players('loss', 'win'),
      moves([3, 4, 3]),
      ALICE,
    );
    expect(view.winnerSeat).toBe(2);
    expect(view.game.winningLine).toBeNull();
    expect(view.endReason).toBe('resign');
    expect(view.game.current).toBeNull();
  });

  it('reports a draw: no winner', () => {
    const view = toMatchView(
      match({ status: 'finished', endReason: 'draw', endedAt: new Date() }),
      players('draw', 'draw'),
      [],
      ALICE,
    );
    expect(view.winnerSeat).toBeNull();
  });

  it('carries the settings of the match', () => {
    const view = toMatchView(
      match({ cols: 9, rows: 7, winLength: 5, theme: 'ocean' }),
      players(),
      [],
      ALICE,
    );
    expect(view.settings).toEqual({
      cols: 9,
      rows: 7,
      winLength: 5,
      theme: 'ocean',
    });
    expect(view.game.board).toHaveLength(9);
    expect(view.game.board[0]).toHaveLength(7);
  });

  it('refuses to hide corrupt saved moves', () => {
    // Seven discs in a column of height six cannot happen in a real game.
    expect(() =>
      toMatchView(match(), players(), moves([0, 0, 0, 0, 0, 0, 0]), ALICE),
    ).toThrow();
  });
});

describe('toMatchSummary', () => {
  it('has the headline facts but no board', () => {
    const summary = toMatchSummary(
      match({ status: 'finished', endReason: 'win', endedAt: new Date() }),
      players('loss', 'win'),
      11,
      BOB,
    );
    expect(summary.winnerSeat).toBe(2);
    expect(summary.yourSeat).toBe(2);
    expect(summary.moveCount).toBe(11);
    expect(summary).not.toHaveProperty('game');
  });
});
