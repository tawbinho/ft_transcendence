import type { User } from './entities/user.entity.js';

// WHY THIS FILE EXISTS
// A User row holds the password hash. It must never leave the server, so
// every response that returns a user goes through toPublicUser(), the one
// place that decides which fields are safe to send to the browser.
// If a field is not listed here, it is not sent.
export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  locale: string;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    locale: user.locale,
  };
}
