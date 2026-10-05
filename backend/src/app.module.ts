import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { validateEnv } from './config/env.validation.js';
import { DatabaseModule } from './database/database.module.js';

// The root module: the app starts here and everything else plugs into it.
@Module({
  imports: [
    // Loads the environment variables and checks them with validateEnv at
    // startup. `isGlobal: true` makes the settings available in every module
    // without importing ConfigModule again.
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    // Opens the connection to Postgres.
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
