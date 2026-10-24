import type { DataSourceOptions } from 'typeorm';
import type { Env } from './env.validation.js';

// Two different things need to connect to the database: the running app
// (database.module.ts) and the migration command line (data-source.ts).

/**
 * The one description of the database connection. Used by the Nest app and
 * by the migration CLI, so both always point at the same place.
 */
export function buildDatabaseOptions(
  // We only ask for the five database settings, not the whole Env.
  env: Pick<Env, 'DB_HOST' | 'DB_PORT' | 'DB_USER' | 'DB_PASSWORD' | 'DB_NAME'>,
): DataSourceOptions {
  return {
    type: 'postgres', // which database engine (uses the `pg` driver)
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    // The schema changes only through migrations, never automatically.
    synchronize: false,
    // Where TypeORM finds the table classes (entities) and the migration files.
    // These are the COMPILED .js files inside dist, not the .ts source.
    entities: ['dist/modules/**/entities/*.entity.js'],
    migrations: ['dist/database/migrations/*.js'],
  };
}
