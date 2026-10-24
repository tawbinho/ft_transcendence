import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { MATCH_STATUSES, type MatchStatus } from '../match.constants.js';

// The query string of GET /matches/mine: an optional status filter and simple
// pagination, so a long history never comes back all at once.
export class ListMatchesQuery {
  @IsOptional()
  @IsIn([...MATCH_STATUSES])
  status?: MatchStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
