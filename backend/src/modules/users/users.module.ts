import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OAuthAccount } from './entities/oauth-account.entity.js';
import { TwoFactor } from './entities/two-factor.entity.js';
import { User } from './entities/user.entity.js';

// The users module. For now it only registers its three entities, which lets
// services in this module (added later) inject a repository for each table.
@Module({
  imports: [TypeOrmModule.forFeature([User, OAuthAccount, TwoFactor])],
})
export class UsersModule {}
