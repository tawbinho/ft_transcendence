import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { UsersModule } from '../users/users.module.js';
import { RealtimeGateway } from './realtime.gateway.js';
import { RealtimeService } from './realtime.service.js';

// The live connection. @Global() makes RealtimeService injectable everywhere
// without importing this module again in every feature module: matches,
// friends and tournaments only ask for it in their constructor.
@Global()
@Module({
  imports: [
    AuthModule, // SessionsService: who is behind this connection
    UsersModule, // PresenceService: who is online
  ],
  providers: [RealtimeGateway, RealtimeService],
  exports: [RealtimeService],
})
export class RealtimeModule {}
