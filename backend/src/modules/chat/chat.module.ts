import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { FriendsModule } from '../friends/friends.module.js';
import { MatchPlayer } from '../matches/entities/match-player.entity.js';
import { Match } from '../matches/entities/match.entity.js';
import { User } from '../users/entities/user.entity.js';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';
import { ConversationRead } from './entities/conversation-read.entity.js';
import { Message } from './entities/message.entity.js';

// The chat module: private conversations between two players. It reads the
// match tables itself (to check an invitation) instead of importing the
// matches module, so the tournaments module can use the chat without a cycle.
@Module({
  imports: [
    TypeOrmModule.forFeature([Message, ConversationRead, Match, MatchPlayer, User]),
    FriendsModule, // BlocksService: no messages between blocked players
    AuthModule, // SessionGuard
  ],
  controllers: [ChatController],
  providers: [ChatService],
  // The tournaments module writes "your match is ready" through it.
  exports: [ChatService],
})
export class ChatModule {}
