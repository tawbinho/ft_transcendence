import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

// WHY THIS FILE EXISTS
// The rules for the login request body, enforced by the global
// ValidationPipe before the controller runs. Deliberately lighter than
// signup: login only needs "looks like an email" and "not empty". Whether
// the password is right is the service's job.
export class LoginDto {
  @ApiProperty({ example: 'mario@example.com' })
  // Same normalisation as signup, so "Mario@X.com " finds "mario@x.com".
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({ example: 'a-strong-password' })
  @IsString()
  @MinLength(1)
  // Same cap as signup: stops huge inputs from slowing down the hashing.
  @MaxLength(128)
  password: string;
}
