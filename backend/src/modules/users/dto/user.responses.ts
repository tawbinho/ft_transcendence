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
