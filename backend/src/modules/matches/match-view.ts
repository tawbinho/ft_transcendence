import { replay } from './engine/game.engine.js';
import type { Position } from './engine/game.types.js';
import type {
  MatchEndReason,
  MatchStatus,
  PlayerResult,
} from './match.constants.js';

// WHY THIS FILE EXISTS
// Turns database rows into the JSON the API sends. It is a PURE function (no
// database, no Nest), so it is easy to test. It also rebuilds the board with
// the engine from the saved moves: the board is never stored.
//
// The inputs are plain shapes rather than the entity classes, so a test can
// build them by hand.

export interface MatchData {
  id: string;
  status: MatchStatus;
  endReason: MatchEndReason | null;
  cols: number;
  rows: number;
  winLength: number;
  theme: string;
  createdAt: Date;
  startedAt: Date | null;
  endedAt: Date | null;
}

export interface PlayerData {
  seat: number;
  userId: string;
  displayName: string;
  result: PlayerResult | null;
}

export interface MoveData {
  ply: number;
  col: number;
}

// ---- What the API returns -------------------------------------------------

export interface PlayerView {
  seat: number;
  userId: string;
  displayName: string;
  result: PlayerResult | null;
}

export interface MatchSettingsView {
  cols: number;
  rows: number;
  winLength: number;
  theme: string;
}

export interface MatchView {
  id: string;
  status: MatchStatus;
  endReason: MatchEndReason | null;
  settings: MatchSettingsView;
  createdAt: Date;
  startedAt: Date | null;
  endedAt: Date | null;
  players: PlayerView[]; // ordered by seat
  yourSeat: number | null; // null if the viewer is not a player
  winnerSeat: number | null; // from the players' results, not from the board
  game: {
    // board[col][row], row 0 is the BOTTOM; 0 empty, 1 or 2 a player's disc
    board: number[][];
    current: number | null; // whose turn; null unless the match is in progress
    lastMove: Position | null;
    winningLine: Position[] | null; // set when the board has a connected line
    moveCount: number;
    moves: number[]; // the columns played, in order
  };
}

// A lighter version for lists (history): no board, just the headline facts.
export interface MatchSummaryView {
  id: string;
  status: MatchStatus;
  endReason: MatchEndReason | null;
  settings: MatchSettingsView;
  createdAt: Date;
  endedAt: Date | null;
  players: PlayerView[];
  yourSeat: number | null;
  winnerSeat: number | null;
  moveCount: number;
}

// ---- Mapping ----------------------------------------------------------------

const bySeat = (a: PlayerView, b: PlayerView) => a.seat - b.seat;

function playersView(players: PlayerData[]): PlayerView[] {
  return players
    .map(({ seat, userId, displayName, result }) => ({
      seat,
      userId,
      displayName,
      result,
    }))
    .sort(bySeat);
}

function viewerSeat(players: PlayerData[], viewerId: string | null): number | null {
  return players.find((player) => player.userId === viewerId)?.seat ?? null;
}

// The winner is whoever has the result 'win'. This is the single source of
// truth: it also covers a resignation, where the board shows no line at all.
function winnerOf(players: PlayerData[]): number | null {
  return players.find((player) => player.result === 'win')?.seat ?? null;
}

function settingsView(match: MatchData): MatchSettingsView {
  return {
    cols: match.cols,
    rows: match.rows,
    winLength: match.winLength,
    theme: match.theme,
  };
}

export function toMatchView(
  match: MatchData,
  players: PlayerData[],
  moves: MoveData[],
  // null: no particular viewer (a live event goes to everybody watching, so
  // `yourSeat` is null and each client keeps the seat it already knows).
  viewerId: string | null,
): MatchView {
  // Replay the moves in order with the engine to get the board. If the saved
  // moves were ever corrupt, this throws, which is what we want: a loud error
  // instead of a wrong board.
  const columns = [...moves].sort((a, b) => a.ply - b.ply).map((m) => m.col);
  const state = replay(
    { cols: match.cols, rows: match.rows, winLength: match.winLength },
    columns,
  );

  return {
    id: match.id,
    status: match.status,
    endReason: match.endReason,
    settings: settingsView(match),
    createdAt: match.createdAt,
    startedAt: match.startedAt,
    endedAt: match.endedAt,
    players: playersView(players),
    yourSeat: viewerSeat(players, viewerId),
    winnerSeat: winnerOf(players),
    game: {
      board: state.board.map((column) => [...column]),
      // Only meaningful while the match is running.
      current: match.status === 'in_progress' ? state.current : null,
      lastMove: state.lastMove,
      winningLine: state.winningLine ? [...state.winningLine] : null,
      moveCount: state.moveCount,
      moves: columns,
    },
  };
}

export function toMatchSummary(
  match: MatchData,
  players: PlayerData[],
  moveCount: number,
  viewerId: string,
): MatchSummaryView {
  return {
    id: match.id,
    status: match.status,
    endReason: match.endReason,
    settings: settingsView(match),
    createdAt: match.createdAt,
    endedAt: match.endedAt,
    players: playersView(players),
    yourSeat: viewerSeat(players, viewerId),
    winnerSeat: winnerOf(players),
    moveCount,
  };
}
