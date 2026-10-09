import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OAuthAccount } from './entities/oauth-account.entity.js';
import { TwoFactorBackupCode } from './entities/two-factor-backup-code.entity.js';
import { TwoFactor } from './entities/two-factor.entity.js';
import { User } from './entities/user.entity.js';
import { AvatarService } from './avatar.service.js';
import { PresenceService } from './presence.service.js';
import { UsersService } from './users.service.js';

// The users module: registers its three entities and exposes UsersService to
// the other modules. Nothing outside this module touches the user tables.
@Module({
  imports: [TypeOrmModule.forFeature([User, OAuthAccount, TwoFactor, TwoFactorBackupCode])],
  providers: [UsersService, PresenceService, AvatarService],
  // Without `exports`, other modules could not inject UsersService.
  exports: [UsersService, PresenceService, AvatarService],
})
export class UsersModule {}
