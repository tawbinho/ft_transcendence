/** The logged-in user, as returned by the backend (`PublicUser`). */
export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  locale: string;
  /**
   * Not sent by the backend yet. When it is, the account page uses it to show
   * the right two-factor action; until then the page asks the server.
   */
  twoFactorEnabled?: boolean;
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

export interface TwoFactorSetup {
  /** QR code image as a data URL, for an <img>. */
  qr: string;
  /** The same secret as text, for manual entry in an authenticator app. */
  secret: string;
}
