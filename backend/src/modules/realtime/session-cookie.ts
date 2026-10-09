import { SESSION_COOKIE } from '../auth/auth-cookies.js';

// WHY THIS FILE EXISTS
// A WebSocket handshake is an HTTP request, so the browser sends the `session`
// cookie with it, but no cookie parser has run. This reads the session token
// out of the raw `Cookie:` header. Pure: easy to test.
export function readSessionToken(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() !== SESSION_COOKIE) continue;
    const value = part.slice(separator + 1).trim();
    try {
      return value === '' ? null : decodeURIComponent(value);
    } catch {
      return null; // a broken %-escape: treat it as no cookie
    }
  }
  return null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The payload of match:watch and match:unwatch is `{ matchId }`. Anything else
// (a client can send whatever it wants) gives null and is ignored.
export function readMatchId(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const matchId = (payload as { matchId?: unknown }).matchId;
  return typeof matchId === 'string' && UUID.test(matchId)
    ? matchId.toLowerCase()
    : null;
}
