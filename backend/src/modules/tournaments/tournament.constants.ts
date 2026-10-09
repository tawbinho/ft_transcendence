// WHY THIS FILE EXISTS
// The allowed values of the tournaments module in ONE place, shared by the
// database entities, the request validation (DTOs) and the service. Changing
// a rule here changes it everywhere.

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

// Single elimination needs a power of two: 4 or 8 places.
export const TOURNAMENT_SIZES = [4, 8] as const;
export type TournamentSize = (typeof TOURNAMENT_SIZES)[number];

// 3 to 30 characters: letters of any language, digits, spaces and - _ ' .
// starting with a letter or a digit. The `u` flag makes \p{L} (any letter)
// work. The name is trimmed BEFORE this is checked (see the DTO).
export const TOURNAMENT_NAME_PATTERN =
  /^[\p{L}\p{N}][\p{L}\p{N} \-_'.]{2,29}$/u;

// The creator may start the tournament before it is full with this many
// players or more (fewer would not make a bracket).
export const MIN_PLAYERS_TO_START = 3;

// Stops a flood of requests; used by the controller.
export const CREATE_LIMIT_PER_MINUTE = 20;
