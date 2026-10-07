// WHY THIS FILE EXISTS
// The allowed values of the matches module in ONE place, shared by the
// database entities, the request validation (DTOs) and the service. Adding a
// theme or changing a limit is a one-line change here.

// Where a match is in its life:
//  waiting     created, waiting for a second player
//  in_progress both players are in, moves are accepted
//  finished    won, drawn or resigned
//  abandoned   cancelled before it started (or left by a disconnect, later)
export const MATCH_STATUSES = [
  'waiting',
  'in_progress',
  'finished',
  'abandoned',
] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

// Why a finished match ended.
export const MATCH_END_REASONS = [
  'win',
  'draw',
  'resign',
  'disconnect',
] as const;
export type MatchEndReason = (typeof MATCH_END_REASONS)[number];

// What the match meant for ONE player. The winner of a match is read from
// here and nowhere else, so two columns can never disagree about who won.
export const PLAYER_RESULTS = ['win', 'loss', 'draw'] as const;
export type PlayerResult = (typeof PLAYER_RESULTS)[number];

// Board themes a player can choose. The server only stores the name; the
// frontend decides how each theme looks. Stored as text and checked against
// this list, which is easier to extend than a database enum.
export const MATCH_THEMES = ['classic', 'ocean', 'sunset', 'midnight'] as const;
export type MatchTheme = (typeof MATCH_THEMES)[number];
export const DEFAULT_THEME: MatchTheme = 'classic';

// What the API lets a player choose. Tighter than what the engine accepts,
// to keep boards playable. The engine also checks that the win length fits
// the board (it must not be longer than the smaller side).
export const SETTINGS_API_LIMITS = {
  cols: { min: 5, max: 10 },
  rows: { min: 5, max: 9 },
  winLength: { min: 3, max: 5 },
} as const;

// Stops one user from flooding the lobby with matches nobody joins.
export const MAX_WAITING_MATCHES_PER_USER = 3;
