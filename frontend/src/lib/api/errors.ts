/**
 * Error raised for every failed API call. `code` is the stable identifier the
 * UI translates; `message` is the backend's English text, used as a fallback.
 * `NETWORK_ERROR` and `BAD_RESPONSE` are produced on the client side.
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
