// WHY THIS FILE EXISTS
// The app needs settings (database host, user, password...) that come from
// environment variables. If one is missing or wrong, we want the app to stop
// immediately with a clear message, instead of crashing later with a vague
// database error. This file is that safety check.

// The shape of the settings once they have been checked.
// Note: environment variables are always text; here PORT and DB_PORT are
// already converted to numbers.
export interface Env {
  PORT: number; // port the backend listens on
  DB_HOST: string; // where Postgres runs ("db" inside Docker)
  DB_PORT: number;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  SESSION_TTL_DAYS: number; // how long a login lasts before the user must log in again
  TWO_FACTOR_KEY: string; // 64 hex chars: AES-256 key that encrypts 2FA secrets in the database
  DISCONNECT_GRACE_SECONDS: number; // how long a player may stay disconnected from a running match
  TOURNAMENT_TURN_TIMEOUT_SECONDS: number; // a tournament player who does not move in this time loses
  AVATAR_DIR: string; // folder where uploaded profile pictures are stored
}

// Returns the variable if it is a non-empty string, otherwise stops the app.
function requiredString(config: Record<string, unknown>, key: string): string {
  const value = config[key];
  if (typeof value !== 'string' || value === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

// Reads a variable as a port number (1 to 65535). If the variable is absent,
// the optional `fallback` is used. Anything else stops the app.
function port(
  config: Record<string, unknown>,
  key: string,
  fallback?: number,
): number {
  const value = Number(config[key] ?? fallback);
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error(`Environment variable ${key} must be a valid port`);
  }
  return value;
}

// Reads a variable as a positive whole number, with a default when absent.
function positiveInt(
  config: Record<string, unknown>,
  key: string,
  fallback: number,
): number {
  const value = Number(config[key] ?? fallback);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`Environment variable ${key} must be a positive integer`);
  }
  return value;
}

/** Runs once at startup: the app refuses to boot with a bad environment. */
// `config` is the raw environment (process.env). Nest's ConfigModule calls
// this function and keeps the returned, checked object as the app settings.
export function validateEnv(config: Record<string, unknown>): Env {
  // AES-256 needs a key of exactly 32 bytes, written as 64 hex characters.
  // Losing or changing this key makes every stored 2FA secret unreadable.
  const twoFactorKey = requiredString(config, 'TWO_FACTOR_KEY');
  if (!/^[0-9a-fA-F]{64}$/.test(twoFactorKey)) {
    throw new Error(
      'TWO_FACTOR_KEY must be 64 hex characters (generate with: openssl rand -hex 32)',
    );
  }

  return {
    PORT: port(config, 'PORT', 3000), // optional, defaults to 3000
    DB_HOST: requiredString(config, 'DB_HOST'),
    DB_PORT: port(config, 'DB_PORT', 5432), // optional, Postgres default
    DB_USER: requiredString(config, 'DB_USER'),
    DB_PASSWORD: requiredString(config, 'DB_PASSWORD'),
    DB_NAME: requiredString(config, 'DB_NAME'),
    SESSION_TTL_DAYS: positiveInt(config, 'SESSION_TTL_DAYS', 7),
    TWO_FACTOR_KEY: twoFactorKey,
    TOURNAMENT_TURN_TIMEOUT_SECONDS: positiveInt(
      config,
      'TOURNAMENT_TURN_TIMEOUT_SECONDS',
      180,
    ),
    DISCONNECT_GRACE_SECONDS: positiveInt(config, 'DISCONNECT_GRACE_SECONDS', 30),
    // optional: Docker sets it to a volume, a local run uses ./uploads/avatars
    AVATAR_DIR:
      typeof config.AVATAR_DIR === 'string' && config.AVATAR_DIR !== ''
        ? config.AVATAR_DIR
        : './uploads/avatars',
  };
}
