import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { Env } from '../../config/env.validation.js';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { RefreshToken } from './entities/refresh-token.entity.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { TokensService } from './tokens.service.js';

// The auth module: signup, login, refresh, logout and "me", plus the guard
// other modules use to protect their routes.
@Module({
  imports: [
    UsersModule, // for UsersService
    TypeOrmModule.forFeature([RefreshToken]),
    // Configures how access tokens are signed and checked. The secret and
    // lifetime come from the validated environment. Pinning the algorithm
    // stops an attacker from choosing a weaker one in a forged token.
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        secret: config.get('JWT_SECRET', { infer: true }),
        signOptions: {
          algorithm: 'HS256',
          expiresIn: config.get('JWT_ACCESS_TTL_SECONDS', { infer: true }),
        },
        verifyOptions: { algorithms: ['HS256'] },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokensService, JwtAuthGuard],
  // Other modules import AuthModule to use @UseGuards(JwtAuthGuard).
  exports: [JwtAuthGuard, TokensService],
})
export class AuthModule {}
