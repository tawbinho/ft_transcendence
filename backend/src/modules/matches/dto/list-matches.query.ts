import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { MATCH_STATUSES, type MatchStatus } from '../match.constants.js';

// WHY THIS FILE EXISTS
// The query string of GET /matches/mine: an optional status filter and
// simple pagination, so a long history never comes back all at once.
// Query values arrive as text, so @Type(() => Number) turns them into numbers
// before they are checked.
export class ListMatchesQuery {
  @ApiPropertyOptional({ enum: MATCH_STATUSES })
  @IsOptional()
  @IsIn([...MATCH_STATUSES])
  status?: MatchStatus;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 50, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiPropertyOptional({ example: 0, minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
