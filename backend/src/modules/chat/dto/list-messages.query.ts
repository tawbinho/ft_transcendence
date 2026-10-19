import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../chat.constants.js';

// WHY THIS FILE EXISTS
// The query string of GET /chat/:userId/messages. Without `before` it gives the
// latest messages; with `before` (the id of the oldest message the reader
// already has) it gives the ones just before it: that is how older messages
// load when the reader scrolls up.
export class ListMessagesQuery {
  @IsOptional()
  @IsUUID()
  before?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit?: number;
}
