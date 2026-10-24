import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';
import {
  DISPLAY_NAME_MAX,
  DISPLAY_NAME_MIN,
  DISPLAY_NAME_PATTERN,
} from '../../users/user.constants.js';

// A DTO (data transfer object) describes what a request body must look like.
// The global ValidationPipe (main.ts) checks every signup request against these
// rules BEFORE the controller runs.
export class SignupDto {
  // Runs before validation: " A@X.com " becomes "a@x.com", so the same
  // address can never be registered twice with different capitalisation.
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(DISPLAY_NAME_MIN, DISPLAY_NAME_MAX)
  // Letters of any language (Arabic, French accents...), digits, _ and -.
  @Matches(DISPLAY_NAME_PATTERN, {
    message:
      'displayName may only contain letters, numbers, underscores and hyphens',
  })
  displayName: string;

  @IsString()
  @MinLength(8)
  // Upper limit so nobody can send a huge password to slow down the hashing.
  @MaxLength(128)
  password: string;
}
