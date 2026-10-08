import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import {
  TOURNAMENT_STATUSES,
  type TournamentStatus,
} from '../tournament.constants.js';

// WHY THIS FILE EXISTS
// The query string of GET /tournaments: an optional status filter and simple
// pagination, so a long list never comes back all at once. Query values
// arrive as text, so @Type(() => Number) turns them into numbers before they
// are checked.
export class ListTournamentsQuery {
  @ApiPropertyOptional({ enum: TOURNAMENT_STATUSES })
  @IsOptional()
  @IsIn([...TOURNAMENT_STATUSES])
  status?: TournamentStatus;

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
