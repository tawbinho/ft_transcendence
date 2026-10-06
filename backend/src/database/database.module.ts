import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule, type TypeOrmModuleOptions } from '@nestjs/typeorm';
import { buildDatabaseOptions } from '../config/database.config.js';
import type { Env } from '../config/env.validation.js';

// WHY THIS FILE EXISTS
// This is the Nest module that opens the connection to Postgres when the app
// starts. Other modules will later just ask for a repository (for example
// "give me the User table") and this connection is what they use underneath.
@Module({
  imports: [
    // forRootAsync = "open the connection, but first wait for the settings
    // (ConfigService) to be ready", because the settings come from .env.
    TypeOrmModule.forRootAsync({
      inject: [ConfigService], // hand the settings reader to the factory below
      // The factory runs once at startup and returns the connection options.
      // We read each setting (already validated in env.validation.ts) and pass
      // them to the shared function that builds the connection description.
      // The `as TypeOrmModuleOptions` cast is only for TypeScript: the Nest
      // wrapper type and TypeORM's own type are structurally the same here.
      useFactory: (config: ConfigService<Env, true>) =>
        ({
          ...buildDatabaseOptions({
            DB_HOST: config.get('DB_HOST', { infer: true }),
            DB_PORT: config.get('DB_PORT', { infer: true }),
            DB_USER: config.get('DB_USER', { infer: true }),
            DB_PASSWORD: config.get('DB_PASSWORD', { infer: true }),
            DB_NAME: config.get('DB_NAME', { infer: true }),
          }),
          // Apply pending migrations every time the app starts, so a fresh
          // clone works with just `docker compose up` (the subject requires
          // one-command deployment). Set here and NOT in the shared config
          // on purpose: the migration CLI also loads that config, and with
          // this flag `migration:revert` would first run all pending
          // migrations and then revert, which is dangerous.
          migrationsRun: true,
        }) as TypeOrmModuleOptions,
    }),
  ],
})
export class DatabaseModule {}
