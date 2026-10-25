// The allowed values of the tournaments module in ONE place, shared by the
// database entities, the request validation (DTOs) and the service. Changing a
// rule here changes it everywhere.

// Where a tournament is in its life:
//  registering  players can join and leave
//  running      the bracket is being played
//  finished     the final has a winner
// A cancelled tournament does not exist any more: cancelling deletes it.
export const TOURNAMENT_STATUSES = [
  'registering',
  'running',
  'finished',
] as const;
export type TournamentStatus = (typeof TOURNAMENT_STATUSES)[number];

// A tournament always has exactly 4 places: two semi-finals and a final.
export const TOURNAMENT_SIZES = [4] as const;
export type TournamentSize = (typeof TOURNAMENT_SIZES)[number];

// 3 to 30 characters: letters of any language, digits, spaces and - _ ' .
// starting with a letter or a digit. The `u` flag makes \p{L} (any letter)
// work.
export const TOURNAMENT_NAME_PATTERN =
  /^[\p{L}\p{N}][\p{L}\p{N} \-_'.]{2,29}$/u;

// Stops a flood of requests; used by the controller.
export const CREATE_LIMIT_PER_MINUTE = 20;
