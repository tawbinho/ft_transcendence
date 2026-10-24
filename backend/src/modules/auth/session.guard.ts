import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { AppError } from '../../common/errors/app-error.js';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator.js';
import { PresenceService } from '../users/presence.service.js';
import { SESSION_COOKIE } from './auth-cookies.js';
import { SessionsService } from './sessions.service.js';

// A guard is the bouncer in front of a route.
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly sessions: SessionsService,
    private readonly presence: PresenceService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();

    const token = request.cookies?.[SESSION_COOKIE] as string | undefined;
    const session = token ? await this.sessions.findActive(token) : null;
    if (!session) throw new AppError('UNAUTHORIZED', 'Please log in', 401);

    request.user = { id: session.userId };
    // Being logged in and making a request = being online.
    this.presence.touch(session.userId);
    return true;
  }
}
