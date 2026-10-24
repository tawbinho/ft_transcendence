import type { User } from './entities/user.entity.js';

// A User row holds the password hash.
export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  locale: string;
  emailVerified: boolean;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    locale: user.locale,
    emailVerified: user.emailVerifiedAt !== null,
  };
}
