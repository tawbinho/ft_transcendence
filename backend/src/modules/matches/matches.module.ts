import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { FriendsModule } from '../friends/friends.module.js';
import { UsersModule } from '../users/users.module.js';
import { MatchMove } from './entities/match-move.entity.js';
import { MatchPlayer } from './entities/match-player.entity.js';
import { Match } from './entities/match.entity.js';
import { MatchesController } from './matches.controller.js';
import { MatchesService } from './matches.service.js';

// The matches module: games between two players. The rules of Connect Four are
// in ./engine; this module stores matches and decides who may do what.
@Module({
  imports: [
    TypeOrmModule.forFeature([Match, MatchPlayer, MatchMove]),
    UsersModule, // for UsersService (finding an invited player by name)
    FriendsModule, // for BlocksService (no invitations between blocked players)
    AuthModule, // for SessionGuard (every route needs a logged-in user)
  ],
  controllers: [MatchesController],
  providers: [MatchesService],
  // The realtime gateway (and later matchmaking and tournaments) will call
  // the same service.
  exports: [MatchesService],
})
export class MatchesModule {}
