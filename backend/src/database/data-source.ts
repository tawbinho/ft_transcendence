import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { buildDatabaseOptions } from '../config/database.config.js';
import { validateEnv } from '../config/env.validation.js';

// WHY THIS FILE EXISTS
// The TypeORM command line (migration:generate, migration:run,
// migration:revert) is a separate program from the Nest app. It cannot use
// Nest's connection, so it needs its own "DataSource" it can load by file
// path. The package.json scripts point at the compiled version of this file.
//
// It reads the same environment variables and builds the connection with the
// same function as the app, so the CLI and the app always agree.

// Used only by the TypeORM CLI (migration:* scripts), against the compiled build.
export default new DataSource(buildDatabaseOptions(validateEnv(process.env)));
