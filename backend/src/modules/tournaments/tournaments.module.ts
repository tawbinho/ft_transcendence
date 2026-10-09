import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { MatchesModule } from '../matches/matches.module.js';
import { TournamentPairing } from './entities/tournament-pairing.entity.js';
import { TournamentPlayer } from './entities/tournament-player.entity.js';
import { Tournament } from './entities/tournament.entity.js';
import { TurnTimeoutService } from './turn-timeout.service.js';
import { TournamentsController } from './tournaments.controller.js';
import { TournamentsService } from './tournaments.service.js';

// The tournaments module: creating, listing, reading, cancelling, joining and
// leaving, starting them and playing the bracket.
@Module({
  imports: [
    TypeOrmModule.forFeature([Tournament, TournamentPlayer, TournamentPairing]),
    MatchesModule, // for MatchesService (the matches of the bracket)
    AuthModule, // for SessionGuard (every route needs a logged-in user)
  ],
  controllers: [TournamentsController],
  providers: [TournamentsService, TurnTimeoutService],
  // The bracket logic and the realtime gateway will call the same service.
  exports: [TournamentsService],
})
export class TournamentsModule {}
