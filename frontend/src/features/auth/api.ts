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
};
