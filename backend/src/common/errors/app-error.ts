// Services throw this when a business rule is broken, for example   throw new
// AppError('EMAIL_TAKEN', 'This email is already registered', 409); The
// frontend gets the stable `code` and can translate it (en/fr/ar), while the
// HTTP status tells it the kind of failure.

export class AppError extends Error {
  constructor(
    // Stable, machine-readable identifier. Never change a code once the
    // frontend depends on it.
    public readonly code: string,
    message: string,
    // HTTP status sent to the client (400 bad input, 401 not logged in,
    // 403 forbidden, 404 not found, 409 conflict...).
    public readonly status: number = 400,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
