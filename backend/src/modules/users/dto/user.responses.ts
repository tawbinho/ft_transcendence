import { ApiProperty } from '@nestjs/swagger';

// WHY THIS FILE EXISTS
// Documentation only: these classes describe, for the Swagger page, what the
// users routes put inside `data`. Keep them in sync with user-view.ts.

export class ProfileStatsResponse {
  @ApiProperty({ example: 10, description: 'wins + losses + draws' })
  played: number;

  @ApiProperty({ example: 6 })
  wins: number;

  @ApiProperty({ example: 3 })
  losses: number;

  @ApiProperty({ example: 1 })
  draws: number;
}

export class PlayerListItemResponse {
  @ApiProperty({ example: '2082b753-ec3c-480d-9ebb-edcfdb5ce293' })
  id: string;

  @ApiProperty({ example: 'mario' })
  displayName: string;

  @ApiProperty({ type: String, nullable: true, example: null })
  avatarUrl: string | null;

  @ApiProperty({ description: 'Seen in the last minute' })
  online: boolean;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: ProfileStatsResponse })
  stats: ProfileStatsResponse;

  @ApiProperty({
    enum: ['self', 'none', 'friends', 'request_sent', 'request_received'],
    description: 'Only `self` and `none` for now: friends are not built yet',
  })
  friendship: string;
}

export class PlayerPageResponse {
  @ApiProperty({ type: [PlayerListItemResponse] })
  items: PlayerListItemResponse[];

  @ApiProperty({ example: 12, description: 'Players matching, all pages' })
  total: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 0 })
  offset: number;
}

export class ProfileResponse {
  @ApiProperty({ example: '2082b753-ec3c-480d-9ebb-edcfdb5ce293' })
  id: string;

  @ApiProperty({ example: 'mario' })
  displayName: string;

  @ApiProperty({ type: String, nullable: true, example: null })
  avatarUrl: string | null;

  @ApiProperty({ description: 'Seen in the last minute' })
  online: boolean;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({
    type: Date,
    nullable: true,
    description: 'When they were last seen; null while online',
  })
  lastSeenAt: Date | null;

  @ApiProperty({ type: ProfileStatsResponse })
  stats: ProfileStatsResponse;

  @ApiProperty({
    enum: ['self', 'none', 'friends', 'request_sent', 'request_received'],
    description: 'Only `self` and `none` for now: friends are not built yet',
  })
  friendship: string;

  @ApiProperty({
    description: 'The viewer blocked this player (always false for now)',
  })
  blocked: boolean;
}

export class ProfileMatchOpponentResponse {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'ann' })
  displayName: string;
}

export class ProfileMatchSettingsResponse {
  @ApiProperty({ example: 7 })
  cols: number;

  @ApiProperty({ example: 6 })
  rows: number;

  @ApiProperty({ example: 4 })
  winLength: number;

  @ApiProperty({ example: 'classic' })
  theme: string;
}

export class ProfileMatchResponse {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: ProfileMatchOpponentResponse })
  opponent: ProfileMatchOpponentResponse;

  @ApiProperty({
    enum: ['win', 'loss', 'draw'],
    description: "The result for the profile's owner",
  })
  result: string;

  @ApiProperty({ type: ProfileMatchSettingsResponse })
  settings: ProfileMatchSettingsResponse;

  @ApiProperty({ type: Date })
  endedAt: Date;

  @ApiProperty({ example: 21 })
  moveCount: number;
}

export class ProfileMatchPageResponse {
  @ApiProperty({ type: [ProfileMatchResponse] })
  items: ProfileMatchResponse[];

  @ApiProperty({ example: 12 })
  total: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 0 })
  offset: number;
}
