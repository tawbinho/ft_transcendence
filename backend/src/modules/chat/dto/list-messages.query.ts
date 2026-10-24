import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { MAX_PAGE_SIZE } from '../chat.constants.js';

// The query string of GET /chat/:userId/messages.
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
