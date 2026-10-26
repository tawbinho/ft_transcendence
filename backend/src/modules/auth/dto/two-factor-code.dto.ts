import { Transform } from 'class-transformer';
import { Matches } from 'class-validator';

// The body of every route that receives a 2FA code: enable, disable and the
// login verification. The emailed code is exactly 6 digits.
export class TwoFactorCodeDto {
  // Authenticator apps often show "123 456": remove the spaces first.
  @Transform(({ value }) =>
    typeof value === 'string' ? value.replace(/\s+/g, '') : value,
  )
  @Matches(/^\d{6}$/, { message: 'code must be exactly 6 digits' })
  code: string;
}
