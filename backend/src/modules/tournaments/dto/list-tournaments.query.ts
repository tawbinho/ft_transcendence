import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import {
  TOURNAMENT_STATUSES,
  type TournamentStatus,
} from '../tournament.constants.js';

// The query string of GET /tournaments: an optional status filter and simple
// pagination, so a long list never comes back all at once.
export class ListTournamentsQuery {
  @IsOptional()
  @IsIn([...TOURNAMENT_STATUSES])
  status?: TournamentStatus;

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
