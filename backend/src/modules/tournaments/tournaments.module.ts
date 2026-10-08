import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { TournamentPlayer } from './entities/tournament-player.entity.js';
import { Tournament } from './entities/tournament.entity.js';
import { TournamentsController } from './tournaments.controller.js';
import { TournamentsService } from './tournaments.service.js';

// The tournaments module: creating, listing, reading, cancelling, joining and
// leaving tournaments. The bracket (start, matches, winners) comes later.
@Module({
  imports: [
    TypeOrmModule.forFeature([Tournament, TournamentPlayer]),
    AuthModule, // for SessionGuard (every route needs a logged-in user)
  ],
  controllers: [TournamentsController],
  providers: [TournamentsService],
  // The bracket logic and the realtime gateway will call the same service.
  exports: [TournamentsService],
})
export class TournamentsModule {}
