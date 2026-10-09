import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { AppError } from '../../common/errors/app-error.js';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator.js';
import { PresenceService } from '../users/presence.service.js';
import { SESSION_COOKIE } from './auth-cookies.js';
import { SessionsService } from './sessions.service.js';

// WHY THIS FILE EXISTS
// A guard is the bouncer in front of a route. Put `@UseGuards(SessionGuard)`
// on a controller or route and it only runs for logged-in users:
//  1. read the session token from the httpOnly cookie,
//  2. look the session up (it must exist, not be expired, and not be a
//     pending-2FA session),
//  3. put the user id on the request, where @CurrentUser() finds it.
//  4. note that the user is online (presence).
// Any failure answers 401 UNAUTHORIZED before the route code runs.
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
