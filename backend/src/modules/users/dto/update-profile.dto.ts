import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Length, Matches } from 'class-validator';
import {
  DISPLAY_NAME_MAX,
  DISPLAY_NAME_MIN,
  DISPLAY_NAME_PATTERN,
} from '../user.constants.js';

// WHY THIS FILE EXISTS
// The body of PATCH /users/me: the new display name, under the same rules as
// signup (they come from the same constants).
export class UpdateProfileDto {
  @ApiProperty({
    example: 'mario',
    minLength: DISPLAY_NAME_MIN,
    maxLength: DISPLAY_NAME_MAX,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(DISPLAY_NAME_MIN, DISPLAY_NAME_MAX)
  @Matches(DISPLAY_NAME_PATTERN, {
    message:
      'displayName may only contain letters, numbers, underscores and hyphens',
  })
  displayName: string;
}
