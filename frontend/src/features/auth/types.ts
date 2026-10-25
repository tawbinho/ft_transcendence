/** The logged-in user, as returned by the backend (`PublicUser`). */
export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  locale: string;
}

export interface SignupInput {
  email: string;
  displayName: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

/** Login either logs in, or asks for a two-factor code first. */
export type LoginResult = { user: User } | { user: null; twoFactorRequired: true };
