import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OAuthAccount } from './entities/oauth-account.entity.js';
import { TwoFactor } from './entities/two-factor.entity.js';
import { User } from './entities/user.entity.js';
import { PresenceService } from './presence.service.js';
import { UsersService } from './users.service.js';

// The users module: registers its three entities and exposes UsersService to
// the other modules. Nothing outside this module touches the user tables.
@Module({
  imports: [TypeOrmModule.forFeature([User, OAuthAccount, TwoFactor])],
  providers: [UsersService, PresenceService],
  // Without `exports`, other modules could not inject UsersService.
  exports: [UsersService, PresenceService],
})
export class UsersModule {}
