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

/** Runs once at startup: the app refuses to boot with a bad environment. */
// `config` is the raw environment (process.env). Nest's ConfigModule calls
// this function and keeps the returned, checked object as the app settings.
export function validateEnv(config: Record<string, unknown>): Env {
  return {
    PORT: port(config, 'PORT', 3000), // optional, defaults to 3000
    DB_HOST: requiredString(config, 'DB_HOST'),
    DB_PORT: port(config, 'DB_PORT', 5432), // optional, Postgres default
    DB_USER: requiredString(config, 'DB_USER'),
    DB_PASSWORD: requiredString(config, 'DB_PASSWORD'),
    DB_NAME: requiredString(config, 'DB_NAME'),
  };
}
