import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { MESSAGE_MAX_LENGTH } from '../chat.constants.js';

// WHY THIS FILE EXISTS
// The body of POST /chat/:userId/messages: EITHER a text (`body`) OR an
// invitation to a match (`matchId`). The rule "exactly one of them" is checked
// by the service, because it needs both fields at once.
export class SendMessageDto {
  @ApiPropertyOptional({
    example: 'Up for a game?',
    minLength: 1,
    maxLength: MESSAGE_MAX_LENGTH,
    description: 'The text, trimmed. Send this OR matchId.',
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, MESSAGE_MAX_LENGTH)
  body?: string;

  @ApiPropertyOptional({
    description:
      'An invitation instead of a text: a match that is waiting, was created by you and is reserved for this player.',
  })
  @IsOptional()
  @IsUUID()
  matchId?: string;
}
