/**
 * Error raised for every failed API call.
 *
 * The backend answers failures as `{ error: { code, message } }`. `code` is a
 * stable identifier (for example `EMAIL_TAKEN` or `NOT_YOUR_TURN`) that the UI
 * translates; `message` is the backend's English explanation, used as a
 * fallback when the code has no translation.
 *
 * Two codes are produced on the client side:
 * - `NETWORK_ERROR` when the server could not be reached at all;
 * - `BAD_RESPONSE` when the answer was not the expected JSON envelope
 *   (for example an HTML error page from the proxy).
 */
export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function isApiError(error: unknown, code?: string): error is ApiError {
  return error instanceof ApiError && (code === undefined || error.code === code);
}

/** The session is missing or expired: the user must log in again. */
export function isUnauthorized(error: unknown): boolean {
  return isApiError(error, 'UNAUTHORIZED');
}
