import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({ example: 1, description: '1 plays first, 2 plays second' })
  seat: number;

  @ApiProperty({ example: '2082b753-ec3c-480d-9ebb-edcfdb5ce293' })
  userId: string;

  @ApiProperty({ example: 'mario' })
  displayName: string;

  @ApiProperty({
    enum: PLAYER_RESULTS,
    nullable: true,
    description: 'null until the match is over',
  })
  result: PlayerResult | null;
}

export class MatchSettingsResponse {
  @ApiProperty({ example: 7 })
  cols: number;

  @ApiProperty({ example: 6 })
  rows: number;

  @ApiProperty({ example: 4, description: 'Discs in a row needed to win' })
  winLength: number;

  @ApiProperty({ example: 'classic' })
  theme: string;
}

export class PositionResponse {
  @ApiProperty({ example: 3, description: 'Column, from 0 on the left' })
  col: number;

  @ApiProperty({ example: 0, description: 'Row, from 0 at the BOTTOM' })
  row: number;
}

export class MatchGameResponse {
  @ApiProperty({
    // An array of columns, each an array of numbers.
    type: 'array',
    items: { type: 'array', items: { type: 'number' } },
    example: [
      [1, 2, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
    ],
    description:
      "board[col][row]: row 0 is the bottom. 0 = empty, 1 or 2 = that seat's disc.",
  })
  board: number[][];

  @ApiProperty({
    nullable: true,
    example: 2,
    description: 'Whose turn it is. null unless the match is in progress.',
  })
  current: number | null;

  @ApiProperty({ type: PositionResponse, nullable: true })
  lastMove: PositionResponse | null;

  @ApiProperty({
    type: [PositionResponse],
    nullable: true,
    description:
      'The connected discs that won, for highlighting. null otherwise.',
  })
  winningLine: PositionResponse[] | null;

  @ApiProperty({ example: 11 })
  moveCount: number;

  @ApiProperty({
    type: [Number],
    example: [3, 3, 4],
    description: 'The columns played, in order',
  })
  moves: number[];
}

export class MatchResponse {
  @ApiProperty({ example: 'f3a4b2c1-0d5e-4f6a-9b7c-8d1e2f3a4b5c' })
  id: string;

  @ApiProperty({ enum: MATCH_STATUSES })
  status: MatchStatus;

  @ApiProperty({ enum: MATCH_END_REASONS, nullable: true })
  endReason: MatchEndReason | null;

  @ApiProperty({ type: MatchSettingsResponse })
  settings: MatchSettingsResponse;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ nullable: true, type: Date })
  startedAt: Date | null;

  @ApiProperty({ nullable: true, type: Date })
  endedAt: Date | null;

  @ApiProperty({ type: [PlayerResponse], description: 'Ordered by seat' })
  players: PlayerResponse[];

  @ApiProperty({
    nullable: true,
    example: 1,
    description:
      'The seat of the user making the request, or null if not a player',
  })
  yourSeat: number | null;

  @ApiProperty({
    nullable: true,
    example: 1,
    description:
      "The winning seat, taken from the players' results (this also covers a resignation). null if nobody won.",
  })
  winnerSeat: number | null;

  @ApiProperty({ type: MatchGameResponse })
  game: MatchGameResponse;
}

export class MatchSummaryResponse {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: MATCH_STATUSES })
  status: MatchStatus;

  @ApiProperty({ enum: MATCH_END_REASONS, nullable: true })
  endReason: MatchEndReason | null;

  @ApiProperty({ type: MatchSettingsResponse })
  settings: MatchSettingsResponse;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ nullable: true, type: Date })
  endedAt: Date | null;

  @ApiProperty({ type: [PlayerResponse] })
  players: PlayerResponse[];

  @ApiProperty({ nullable: true, example: 1 })
  yourSeat: number | null;

  @ApiProperty({ nullable: true, example: 1 })
  winnerSeat: number | null;

  @ApiProperty({ example: 11 })
  moveCount: number;
}

export class MatchPageResponse {
  @ApiProperty({ type: [MatchSummaryResponse] })
  items: MatchSummaryResponse[];

  @ApiProperty({
    example: 42,
    description: 'How many matches match the filter in total',
  })
  total: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 0 })
  offset: number;
}
