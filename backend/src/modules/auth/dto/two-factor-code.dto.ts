import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Matches } from 'class-validator';

// WHY THIS FILE EXISTS
// The body of every route that receives a 2FA code: enable, disable and the
// login verification. A TOTP code is exactly 6 digits.
export class TwoFactorCodeDto {
  @ApiProperty({ example: '123456', description: '6-digit code from the authenticator app' })
  // Authenticator apps often show "123 456": remove the spaces first.
  @Transform(({ value }) =>
    typeof value === 'string' ? value.replace(/\s+/g, '') : value,
  )
  @Matches(/^\d{6}$/, { message: 'code must be exactly 6 digits' })
  code: string;
}
