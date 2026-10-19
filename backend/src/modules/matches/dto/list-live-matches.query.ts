import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

// WHY THIS FILE EXISTS
// The query string of GET /matches/live: pagination only (every match listed
// is in progress, so there is no status filter). Query values arrive as text,
// so @Type(() => Number) turns them into numbers before they are checked.
export class ListLiveMatchesQuery {
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
