import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TwoFactorBackupCode } from '../users/entities/two-factor-backup-code.entity.js';
import { TwoFactor } from '../users/entities/two-factor.entity.js';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { Session } from './entities/session.entity.js';
import { SessionGuard } from './session.guard.js';
import { SessionsService } from './sessions.service.js';
import { BackupCodesService } from './two-factor/backup-codes.service.js';
import { SecretCipher } from './two-factor/secret-cipher.js';
import { TwoFactorService } from './two-factor/two-factor.service.js';

// The auth module: signup, login (with the optional 2FA step), logout and
// "me", plus the guard and the sessions service other modules use to know who
// is logged in (HTTP routes now, WebSockets later).
@Module({
  imports: [
    UsersModule, // for UsersService
    // Session belongs to auth; TwoFactor is owned by the users module but its
    // setup/verify logic lives here.
    TypeOrmModule.forFeature([Session, TwoFactor, TwoFactorBackupCode]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    SessionsService,
    TwoFactorService,
    BackupCodesService,
    SecretCipher,
    SessionGuard,
  ],
  // Other modules import AuthModule to use @UseGuards(SessionGuard), and the
  // WebSocket gateway will use SessionsService to authenticate a connection.
  // UsersModule is re-exported because SessionGuard needs PresenceService, and a
  // guard is built inside the module that uses it.
  exports: [SessionGuard, SessionsService, UsersModule],
})
export class AuthModule {}
