import type { CookieOptions, Response } from 'express';
import type { IssuedTokens } from './tokens.service.js';

// WHY THIS FILE EXISTS
// The tokens travel in cookies, and the cookie settings are security
// critical, so they are defined in exactly one place.
export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';

// Settings every auth cookie shares.
const baseOptions = (): CookieOptions => ({
  // JavaScript in the page cannot read the cookie, so an XSS bug cannot
  // steal the tokens.
  httpOnly: true,
  // The browser does not send the cookie on cross-site requests: blocks most
  // CSRF attacks while still working for normal navigation.
  sameSite: 'lax',
  // In production the cookie is only sent over HTTPS.
  secure: process.env.NODE_ENV === 'production',
});

export function setAuthCookies(
  res: Response,
  tokens: IssuedTokens,
  accessTtlSeconds: number,
): void {
  res.cookie(ACCESS_COOKIE, tokens.accessToken, {
    ...baseOptions(),
    path: '/',
    maxAge: accessTtlSeconds * 1000,
  });
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    ...baseOptions(),
    // Only sent to /api/auth/*, not with every request: the refresh token is
    // powerful, so it should travel as little as possible.
    path: '/api/auth',
    expires: tokens.refreshExpiresAt,
  });
}

// Clearing needs the same path as when the cookie was set, otherwise the
// browser keeps it.
export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, { ...baseOptions(), path: '/' });
  res.clearCookie(REFRESH_COOKIE, { ...baseOptions(), path: '/api/auth' });
}
