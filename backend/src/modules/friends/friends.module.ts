import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { UsersModule } from '../users/users.module.js';
import { BlocksController } from './blocks.controller.js';
import { BlocksService } from './blocks.service.js';
import { Block } from './entities/block.entity.js';
import { Friendship } from './entities/friendship.entity.js';
import { FriendsController } from './friends.controller.js';
import { FriendsService } from './friends.service.js';

// The friends module: friend requests, friendships and blocking.
@Module({
  imports: [
    TypeOrmModule.forFeature([Friendship, Block]),
    UsersModule, // for UsersService (does the other player exist?)
    AuthModule, // for SessionGuard
  ],
  controllers: [FriendsController, BlocksController],
  providers: [FriendsService, BlocksService],
  // Matches (invitations) and chat ask BlocksService whether two players
  // blocked each other.
  exports: [FriendsService, BlocksService],
})
export class FriendsModule {}
