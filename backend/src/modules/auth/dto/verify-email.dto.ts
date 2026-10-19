import { Transform } from 'class-transformer';
import { IsEmail, IsString, Matches, MaxLength } from 'class-validator';

const lowerEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class ResendVerificationDto {
  @Transform(lowerEmail)
  @IsEmail()
  @MaxLength(254)
  email: string;
}

export class VerifyEmailDto extends ResendVerificationDto {
  @IsString()
  @Matches(/^\d{6}$/, { message: 'code must be 6 digits' })
  code: string;
}
