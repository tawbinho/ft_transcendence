import { isApiError } from '@/lib/api/errors';
import { http } from '@/lib/api/http';
import type { LoginInput, LoginResult, SignupInput, TwoFactorSetup, User } from './types';

export const authApi = {
  /** The logged-in user, or null when nobody is logged in. */
  me: (signal?: AbortSignal) => http.get<User | null>('/auth/me', { signal }),

  signup: (input: SignupInput) => http.post<{ verificationSent: true }>('/auth/signup', input),

  verifyEmail: (input: { email: string; code: string }) => http.post<null>('/auth/verify-email', input),

  forgotPassword: (email: string) => http.post<null>('/auth/forgot-password', { email }),

  resetPassword: (input: { email: string; code: string; password: string }) =>
    http.post<null>('/auth/reset-password', input),

  resendVerification: (email: string) => http.post<null>('/auth/resend-verification', { email }),

  login: (input: LoginInput) => http.post<LoginResult>('/auth/login', input),

  /** Second step of a login when the account has two-factor turned on. */
  verifyTwoFactor: (code: string) => http.post<{ user: User }>('/auth/2fa/verify', { code }),

  logout: () => http.post<null>('/auth/logout'),

  setupTwoFactor: () => http.post<TwoFactorSetup>('/auth/2fa/setup'),

  /** The first code from the app turns 2FA on; the answer holds the 10 backup codes, sent only this once. */
  enableTwoFactor: (code: string) => http.post<{ backupCodes: string[] }>('/auth/2fa/enable', { code }),

  disableTwoFactor: (code: string) => http.post<null>('/auth/2fa/disable', { code }),

  /**
   * Is two-factor turned on? `GET /auth/me` does not say, so this asks for the
   * number of backup codes left: the server answers when 2FA is on and with
   * TWO_FACTOR_NOT_ENABLED when it is off. Nothing is changed by asking.
   */
  twoFactorEnabled: async (signal?: AbortSignal): Promise<boolean> => {
    try {
      await http.get<{ remaining: number }>('/auth/2fa/backup-codes', { signal });
      return true;
    } catch (error) {
      if (isApiError(error, 'TWO_FACTOR_NOT_ENABLED')) return false;
      throw error;
    }
  },
};
