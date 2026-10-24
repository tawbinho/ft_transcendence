import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

// The rules for the login request body, enforced by the global ValidationPipe
// before the controller runs.
export class LoginDto {
  // Same normalisation as signup, so "Mario@X.com " finds "mario@x.com".
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @MinLength(1)
  // Same cap as signup: stops huge inputs from slowing down the hashing.
  @MaxLength(128)
  password: string;
}
