import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { buildDatabaseOptions } from '../config/database.config.js';
import { validateEnv } from '../config/env.validation.js';

// The TypeORM command line (migration:generate, migration:run,
// migration:revert) is a separate program from the Nest app.

// Used only by the TypeORM CLI (migration:* scripts), against the compiled
// build.
export default new DataSource(buildDatabaseOptions(validateEnv(process.env)));
