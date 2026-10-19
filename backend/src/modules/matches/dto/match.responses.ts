import {
  MATCH_END_REASONS,
  MATCH_STATUSES,
  PLAYER_RESULTS,
  type MatchEndReason,
  type MatchStatus,
  type PlayerResult,
} from '../match.constants.js';

// WHY THIS FILE EXISTS
// Documentation only: these classes describe, for the Swagger page, what the
// match routes put inside `data`. They do not change what the API returns.
// Keep them in sync with match-view.ts, which builds the real objects.

export class PlayerResponse {
  seat: number;

  userId: string;

  displayName: string;

  result: PlayerResult | null;
}

export class MatchSettingsResponse {
  cols: number;

  rows: number;

  winLength: number;

  theme: string;
}

export class PositionResponse {
  col: number;

  row: number;
}

export class MatchGameResponse {
  board: number[][];

  current: number | null;

  lastMove: PositionResponse | null;

  winningLine: PositionResponse[] | null;

  moveCount: number;

  moves: number[];
}

export class MatchResponse {
  id: string;

  status: MatchStatus;

  endReason: MatchEndReason | null;

  settings: MatchSettingsResponse;

  createdAt: Date;

  startedAt: Date | null;

  endedAt: Date | null;

  players: PlayerResponse[];

  yourSeat: number | null;

  winnerSeat: number | null;

  game: MatchGameResponse;
}

export class MatchSummaryResponse {
  id: string;

  status: MatchStatus;

  endReason: MatchEndReason | null;

  settings: MatchSettingsResponse;

  createdAt: Date;

  endedAt: Date | null;

  players: PlayerResponse[];

  yourSeat: number | null;

  winnerSeat: number | null;

  moveCount: number;
}

export class MatchPageResponse {
  items: MatchSummaryResponse[];

  total: number;

  limit: number;

  offset: number;
}
