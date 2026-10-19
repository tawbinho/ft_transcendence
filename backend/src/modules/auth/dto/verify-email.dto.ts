import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, Matches, MaxLength } from 'class-validator';

const lowerEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class ResendVerificationDto {
  @ApiProperty({ example: 'mario@example.com' })
  @Transform(lowerEmail)
  @IsEmail()
  @MaxLength(254)
  email: string;
}

export class VerifyEmailDto extends ResendVerificationDto {
  @ApiProperty({ example: '042917', description: 'The 6 digits from the email' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'code must be 6 digits' })
  code: string;
}
