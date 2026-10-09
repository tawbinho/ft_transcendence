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

// The body of the routes that accept EITHER the 6-digit code of the app OR a
// one-time backup code (like "ABCDE-FGHJK"): the login verification, turning
// 2FA off, and making new backup codes. Same field name as before (`code`), so
// an app that only sends 6 digits keeps working.
export class TwoFactorOrBackupCodeDto {
  @ApiProperty({
    example: '123456',
    description:
      'The 6-digit code from the authenticator app, or a backup code such as ABCDE-FGHJK',
  })
  // Spaces removed, capitals: "abcde fghjk" is accepted like "ABCDE-FGHJK".
  @Transform(({ value }) =>
    typeof value === 'string' ? value.replace(/\s+/g, '').toUpperCase() : value,
  )
  @Matches(/^(\d{6}|[0-9A-Z]{5}-?[0-9A-Z]{5})$/, {
    message: 'code must be 6 digits, or a backup code like ABCDE-FGHJK',
  })
  code: string;
}
