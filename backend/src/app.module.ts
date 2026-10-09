import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { HttpThrottlerGuard } from './common/guards/http-throttler.guard.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { validateEnv } from './config/env.validation.js';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { MatchesModule } from './modules/matches/matches.module.js';
import { TournamentsModule } from './modules/tournaments/tournaments.module.js';
import { RealtimeModule } from './modules/realtime/realtime.module.js';
import { FriendsModule } from './modules/friends/friends.module.js';
import { UsersHttpModule } from './modules/users/users-http.module.js';
import { UsersModule } from './modules/users/users.module.js';

// The root module: the app starts here and everything else plugs into it.
@Module({
  imports: [
    // Loads the environment variables and checks them with validateEnv at
    // startup. `isGlobal: true` makes the settings available in every module
    // without importing ConfigModule again.
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    // Rate limiting: by default 100 requests per minute per IP address.
    // Sensitive routes (login, signup, 2FA) tighten this with @Throttle.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    // Opens the connection to Postgres.
    DatabaseModule,
    // Feature modules.
    UsersModule,
    AuthModule,
    MatchesModule,
    TournamentsModule,
    UsersHttpModule,
    FriendsModule,
    RealtimeModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Applies the rate limit to every route of the app.
    { provide: APP_GUARD, useClass: HttpThrottlerGuard },
  ],
})
export class AppModule {}
