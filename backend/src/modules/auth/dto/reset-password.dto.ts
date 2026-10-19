import { IsString, MaxLength, MinLength } from 'class-validator';
import { VerifyEmailDto } from './verify-email.dto.js';

// ForgotPasswordDto is ResendVerificationDto: just an email.
export class ResetPasswordDto extends VerifyEmailDto {
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}
