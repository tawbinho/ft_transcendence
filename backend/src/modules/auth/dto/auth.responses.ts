import { PublicUserResponse } from '../../users/dto/public-user.response.js';

// Documentation only: these classes describe, for the Swagger page, what the
// auth routes put inside `data` in their responses. They do not change what the
// API returns.

// 2fa/verify
export class SessionResponse {
  user: PublicUserResponse;
}

// login: `user` is null and `twoFactorRequired` is true when the account has
// 2FA on.
export class LoginResponse {
  user: PublicUserResponse | null;

  twoFactorRequired?: true;
}

export class TwoFactorStatusResponse {
  enabled: boolean;
}
