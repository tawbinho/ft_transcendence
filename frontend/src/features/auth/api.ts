import { http } from '@/lib/api/http';
import type { LoginInput, LoginResult, SignupInput, TwoFactorSetup, User } from './types';

export const authApi = {
  /** The logged-in user, or null when nobody is logged in. */
  me: (signal?: AbortSignal) => http.get<User | null>('/auth/me', { signal }),

  signup: (input: SignupInput) => http.post<{ user: User }>('/auth/signup', input),

  login: (input: LoginInput) => http.post<LoginResult>('/auth/login', input),

  /** Second step of a login when the account has two-factor turned on. */
  verifyTwoFactor: (code: string) => http.post<{ user: User }>('/auth/2fa/verify', { code }),

  logout: () => http.post<null>('/auth/logout'),

  setupTwoFactor: () => http.post<TwoFactorSetup>('/auth/2fa/setup'),

  enableTwoFactor: (code: string) => http.post<null>('/auth/2fa/enable', { code }),

  disableTwoFactor: (code: string) => http.post<null>('/auth/2fa/disable', { code }),
};
