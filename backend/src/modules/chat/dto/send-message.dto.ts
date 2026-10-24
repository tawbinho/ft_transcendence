import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { MESSAGE_MAX_LENGTH } from '../chat.constants.js';

// The body of POST /chat/:userId/messages: EITHER a text (`body`) OR an
// invitation to a match (`matchId`).
export class SendMessageDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, MESSAGE_MAX_LENGTH)
  body?: string;

  @IsOptional()
  @IsUUID()
  matchId?: string;
}
