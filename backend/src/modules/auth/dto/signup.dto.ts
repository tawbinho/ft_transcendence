import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';
import {
  DISPLAY_NAME_MAX,
  DISPLAY_NAME_MIN,
  DISPLAY_NAME_PATTERN,
} from '../../users/user.constants.js';

// WHY THIS FILE EXISTS
// A DTO (data transfer object) describes what a request body must look like.
// The global ValidationPipe (main.ts) checks every signup request against
// these rules BEFORE the controller runs. A request that breaks a rule, or
// that sends a field not listed here, is rejected with VALIDATION_ERROR.
// The @ApiProperty lines only feed the Swagger page (/api/docs).
export class SignupDto {
  @ApiProperty({ example: 'mario@example.com' })
  // Runs before validation: " A@X.com " becomes "a@x.com", so the same
  // address can never be registered twice with different capitalisation.
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({ example: 'mario', minLength: 3, maxLength: 20 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(DISPLAY_NAME_MIN, DISPLAY_NAME_MAX)
  // Letters of any language (Arabic, French accents...), digits, _ and -.
  @Matches(DISPLAY_NAME_PATTERN, {
    message:
      'displayName may only contain letters, numbers, underscores and hyphens',
  })
  displayName: string;

  @ApiProperty({ example: 'a-strong-password', minLength: 8, maxLength: 128 })
  @IsString()
  @MinLength(8)
  // Upper limit so nobody can send a huge password to slow down the hashing.
  @MaxLength(128)
  password: string;
}
