import { PublicUserResponse } from '../../users/dto/public-user.response.js';

// WHY THIS FILE EXISTS
// Documentation only: these classes describe, for the Swagger page, what the
// auth routes put inside `data` in their responses. They do not change what
// the API returns. Keep them in sync with the controller's return types.

// signup and 2fa/verify
export class SessionResponse {
  user: PublicUserResponse;
}

// login: `user` is null and `twoFactorRequired` is true when the account has
// 2FA on. The `session` cookie is then only a short-lived (5 minutes) pending
// session; the client must call POST /auth/2fa/verify with the 6-digit code.
export class LoginResponse {
  user: PublicUserResponse | null;

  twoFactorRequired?: true;
}

export class TwoFactorSetupResponse {
  qr: string;

  secret: string;
}

export class BackupCodesResponse {
  backupCodes: string[];
}

export class BackupCodesRemainingResponse {
  remaining: number;
}
