import { ApiProperty } from '@nestjs/swagger';
import { MatchSettingsResponse } from '../../matches/dto/match.responses.js';
import {
  TOURNAMENT_SIZES,
  TOURNAMENT_STATUSES,
  type TournamentSize,
  type TournamentStatus,
} from '../tournament.constants.js';

// WHY THIS FILE EXISTS
// Documentation only: these classes describe, for the Swagger page, what the
// tournament routes put inside `data`. They do not change what the API
// returns. Keep them in sync with tournament-view.ts, which builds the real
// objects.

export class PlayerRefResponse {
  @ApiProperty({ example: '2082b753-ec3c-480d-9ebb-edcfdb5ce293' })
  id: string;

  @ApiProperty({ example: 'mario' })
  displayName: string;
}

export class TournamentPlayerResponse extends PlayerRefResponse {
  @ApiProperty({ type: String, nullable: true, example: null })
  avatarUrl: string | null;

  @ApiProperty({
    example: false,
    description: 'Seen in the last minute (or a live connection is open)',
  })
  online: boolean;
}

export class PairingResponse {
  @ApiProperty()
  id: string;

  @ApiProperty({
    type: [TournamentPlayerResponse],
    nullable: true,
    description:
      'Exactly two places. null: waiting for the winner of an earlier pairing, or empty (bye)',
  })
  players: (TournamentPlayerResponse | null)[];

  @ApiProperty({ type: String, nullable: true })
  matchId: string | null;

  @ApiProperty({ type: String, nullable: true })
  winnerId: string | null;

  @ApiProperty({ description: 'One player went through without playing' })
  bye: boolean;
}

export class RoundResponse {
  @ApiProperty({ type: [PairingResponse] })
  pairings: PairingResponse[];
}

export class TournamentSummaryResponse {
  @ApiProperty({ example: 'f3a4b2c1-0d5e-4f6a-9b7c-8d1e2f3a4b5c' })
  id: string;

  @ApiProperty({ example: 'Friday cup' })
  name: string;

  @ApiProperty({ enum: TOURNAMENT_STATUSES })
  status: TournamentStatus;

  @ApiProperty({ enum: TOURNAMENT_SIZES, description: 'Number of places' })
  size: TournamentSize;

  @ApiProperty({ example: 2, description: 'How many players registered' })
  playerCount: number;

  @ApiProperty({
    type: MatchSettingsResponse,
    description: 'The board of every match of the tournament',
  })
  settings: MatchSettingsResponse;

  @ApiProperty({ type: PlayerRefResponse })
  createdBy: PlayerRefResponse;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: PlayerRefResponse, nullable: true })
  winner: PlayerRefResponse | null;

  @ApiProperty({ description: 'The viewer is registered' })
  joined: boolean;
}

export class TournamentResponse extends TournamentSummaryResponse {
  @ApiProperty({
    type: [TournamentPlayerResponse],
    description: 'In order of registration',
  })
  players: TournamentPlayerResponse[];

  @ApiProperty({
    type: [RoundResponse],
    description:
      'Empty until the tournament starts. rounds[0] is the first round',
  })
  rounds: RoundResponse[];

  @ApiProperty({ type: Date, nullable: true })
  startedAt: Date | null;

  @ApiProperty({ type: Date, nullable: true })
  endedAt: Date | null;
}

export class TournamentPageResponse {
  @ApiProperty({ type: [TournamentSummaryResponse] })
  items: TournamentSummaryResponse[];

  @ApiProperty({
    example: 12,
    description: 'How many tournaments match the filter in total',
  })
  total: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 0 })
  offset: number;
}
