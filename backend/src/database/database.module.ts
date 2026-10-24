import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule, type TypeOrmModuleOptions } from '@nestjs/typeorm';
import { buildDatabaseOptions } from '../config/database.config.js';
import type { Env } from '../config/env.validation.js';

// This is the Nest module that opens the connection to Postgres when the app
// starts.
@Module({
  imports: [
    // forRootAsync = "open the connection, but first wait for the settings
    // (ConfigService) to be ready", because the settings come from .env.
    TypeOrmModule.forRootAsync({
      inject: [ConfigService], // hand the settings reader to the factory below
      // The factory runs once at startup and returns the connection options.
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
          // one-command deployment).
          migrationsRun: true,
        }) as TypeOrmModuleOptions,
    }),
  ],
})
export class DatabaseModule {}
