import type { CookieOptions, Response } from 'express';
import type { IssuedSession } from './sessions.service.js';

// WHY THIS FILE EXISTS
// The login travels in ONE cookie, and its settings are security critical, so
// they are defined in exactly one place. The cookie holds a random token; the
// server stores only its hash (see SessionsService).
export const SESSION_COOKIE = 'session';

const baseOptions = (): CookieOptions => ({
  // JavaScript in the page cannot read the cookie, so an XSS bug cannot
  // steal the login.
  httpOnly: true,
  // The browser does not send the cookie on cross-site requests: blocks most
  // CSRF attacks while still working for normal navigation.
  sameSite: 'lax',
  // In production the cookie is only sent over HTTPS.
  secure: process.env.NODE_ENV === 'production',
  path: '/',
});

// Used for a real login (lasts SESSION_TTL_DAYS) and for the short-lived
// "2FA code still needed" state (5 minutes): the expiry comes from the
// session itself.
export function setSessionCookie(res: Response, session: IssuedSession): void {
  res.cookie(SESSION_COOKIE, session.token, {
    ...baseOptions(),
    expires: session.expiresAt,
  });
}

// Clearing needs the same attributes as when the cookie was set, otherwise
// the browser keeps it.
export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, baseOptions());
}
