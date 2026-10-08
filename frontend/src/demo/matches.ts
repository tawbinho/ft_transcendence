import { chooseMove } from '@/features/game/bot';
import { drop, GameRuleError, replay, validateSettings, type Seat } from '@/features/game/engine';
import { BOARD_LIMITS, DEFAULT_BOARD_SETTINGS, isBoardTheme } from '@/features/game/settings';
import type { MatchSettings } from '@/features/matches/types';
import { isoNow, newId, randomBetween, type DemoDb, type DemoMatch } from './db';
import { conflict, DemoError, invalid } from './router';
import { findPlayer } from './views';

// Matches against made-up players, played by the computer opponent. They
// follow the backend's rules: same statuses, same error codes.

/** Checks settings like the backend's CreateMatchDto + engine do. */
export function readSettings(value: unknown): MatchSettings {
  const input = (typeof value === 'object' && value !== null ? value : {}) as Partial<
    Record<keyof MatchSettings, unknown>
  >;
  const settings = { ...DEFAULT_BOARD_SETTINGS, ...input } as MatchSettings;
  const inRange = (n: unknown, { min, max }: { min: number; max: number }) =>
    typeof n === 'number' && Number.isInteger(n) && n >= min && n <= max;
  if (
    !inRange(settings.cols, BOARD_LIMITS.cols) ||
    !inRange(settings.rows, BOARD_LIMITS.rows) ||
    !inRange(settings.winLength, BOARD_LIMITS.winLength) ||
    !isBoardTheme(settings.theme)
  ) {
    throw invalid('Invalid board settings');
  }
  try {
    validateSettings(settings);
  } catch {
    throw new DemoError(400, 'INVALID_SETTINGS', 'The win length must fit the board');
  }
  return { cols: settings.cols, rows: settings.rows, winLength: settings.winLength, theme: settings.theme };
}

interface NewMatch {
  settings: MatchSettings;
  /** One player (the match waits for a second one) or two (it starts at once). */
  players: { userId: string; displayName: string; seat: Seat }[];
  invitedId?: string | null;
  moveDelay?: number;
  tournamentId?: string | null;
}

export function createMatch(db: DemoDb, input: NewMatch): DemoMatch {
  const match: DemoMatch = {
    id: newId(),
    status: 'waiting',
    endReason: null,
    settings: input.settings,
    createdAt: isoNow(),
    startedAt: null,
    endedAt: null,
    players: input.players.map((player) => ({ ...player, result: null })).sort((a, b) => a.seat - b.seat),
    moves: [],
    invitedId: input.invitedId ?? null,
    nextMoveAt: null,
    moveDelay: input.moveDelay ?? 1500,
    tournamentId: input.tournamentId ?? null,
  };
  db.matches.push(match);
  if (match.players.length === 2) startMatch(db, match);
  return match;
}

const isComputer = (db: DemoDb, userId: string) => findPlayer(db, userId) !== undefined;

function currentSeat(match: DemoMatch): Seat {
  return match.moves.length % 2 === 0 ? 1 : 2;
}

/** When a made-up player is to move, plans their move after some thinking time. */
function planNextMove(db: DemoDb, match: DemoMatch, now: number): void {
  const mover = match.players.find((player) => player.seat === currentSeat(match));
  match.nextMoveAt =
    match.status === 'in_progress' && mover && isComputer(db, mover.userId)
      ? now + match.moveDelay * randomBetween(0.6, 1.4)
      : null;
}

export function startMatch(db: DemoDb, match: DemoMatch, now = Date.now()): void {
  match.status = 'in_progress';
  match.startedAt = new Date(now).toISOString();
  match.invitedId = null;
  planNextMove(db, match, now);
}

/** Adds a second player to a waiting match and starts it. */
export function joinMatch(db: DemoDb, match: DemoMatch, player: { userId: string; displayName: string }): void {
  const seat: Seat = match.players[0]!.seat === 1 ? 2 : 1;
  match.players.push({ ...player, seat, result: null });
  match.players.sort((a, b) => a.seat - b.seat);
  startMatch(db, match);
}

function finish(match: DemoMatch, winnerSeat: Seat | null, reason: DemoMatch['endReason'], now: number): void {
  match.status = 'finished';
  match.endReason = reason;
  match.endedAt = new Date(now).toISOString();
  match.nextMoveAt = null;
  for (const player of match.players) {
    player.result = winnerSeat === null ? 'draw' : player.seat === winnerSeat ? 'win' : 'loss';
  }
}

/** Drops a disc for `seat`, with the backend's error codes. */
export function playMove(db: DemoDb, match: DemoMatch, seat: Seat, col: unknown, now = Date.now()): void {
  if (match.status !== 'in_progress') throw conflict('MATCH_NOT_ACTIVE', 'This match is not in progress');
  if (currentSeat(match) !== seat) throw conflict('NOT_YOUR_TURN', 'It is not your turn');
  if (typeof col !== 'number' || !Number.isInteger(col)) throw invalid('col must be a whole number');

  let state = replay(match.settings, match.moves);
  try {
    state = drop(state, col);
  } catch (error) {
    if (error instanceof GameRuleError) {
      throw new DemoError(error.code === 'INVALID_COLUMN' ? 400 : 409, error.code, error.message);
    }
    throw error;
  }
  match.moves.push(col);

  if (state.status === 'won') finish(match, seat, 'win', now);
  else if (state.status === 'draw') finish(match, null, 'draw', now);
  else planNextMove(db, match, now);
}

/** The viewer gives up: a waiting match is cancelled, a running one is lost. */
export function resign(match: DemoMatch, seat: Seat, now = Date.now()): void {
  if (match.status === 'waiting') {
    match.status = 'abandoned';
    match.endedAt = new Date(now).toISOString();
    return;
  }
  if (match.status !== 'in_progress') throw conflict('MATCH_NOT_ACTIVE', 'This match is not in progress');
  finish(match, seat === 1 ? 2 : 1, 'resign', now);
}

/** Lets a made-up player move if their thinking time is over. Returns whether it moved. */
export function playComputerTurn(db: DemoDb, match: DemoMatch, now: number): boolean {
  if (match.status !== 'in_progress' || match.nextMoveAt === null || now < match.nextMoveAt) return false;
  const seat = currentSeat(match);
  const mover = match.players.find((player) => player.seat === seat);
  const level = mover ? findPlayer(db, mover.userId)?.level : undefined;
  if (!level) {
    match.nextMoveAt = null;
    return false;
  }
  const col = chooseMove(replay(match.settings, match.moves), level, { timeBudgetMs: 40 });
  playMove(db, match, seat, col, now);
  return true;
}
