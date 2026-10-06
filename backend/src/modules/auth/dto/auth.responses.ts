import { ApiProperty } from '@nestjs/swagger';
import { PublicUserResponse } from '../../users/dto/public-user.response.js';

// WHY THIS FILE EXISTS
// Documentation only: these classes describe, for the Swagger page, what the
// auth routes put inside `data` in their responses. They do not change what
// the API returns. Keep them in sync with the controller's return types.

// signup, 2fa/verify and refresh
export class SessionResponse {
  @ApiProperty({ type: PublicUserResponse })
  user: PublicUserResponse;
}

// login: `user` is null and `twoFactorRequired` is true when the account has
// 2FA on. Only a short-lived `pending_2fa` cookie is set in that case; the
// client must then call POST /auth/2fa/verify with the 6-digit code.
export class LoginResponse {
  @ApiProperty({ type: PublicUserResponse, nullable: true })
  user: PublicUserResponse | null;

  @ApiProperty({
    required: false,
    example: true,
    description: 'Present (true) only when a 2FA code is still needed',
  })
  twoFactorRequired?: true;
}

export class TwoFactorSetupResponse {
  @ApiProperty({
    example: 'data:image/png;base64,iVBORw0KGgo...',
    description: 'QR code image as a data URL, for an <img> tag',
  })
  qr: string;

  @ApiProperty({
    example: 'JBSWY3DPEHPK3PXP',
    description: 'The same secret as text, for manual entry in the app',
  })
  secret: string;
}
