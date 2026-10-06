import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { AppError } from '../../common/errors/app-error.js';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator.js';
import { ACCESS_COOKIE } from './auth-cookies.js';
import { TokensService } from './tokens.service.js';

// WHY THIS FILE EXISTS
// A guard is the bouncer in front of a route. Put `@UseGuards(JwtAuthGuard)`
// on a controller or route and it only runs for logged-in users:
//  1. read the access token from the httpOnly cookie,
//  2. verify its signature and expiry (no database needed),
//  3. put the user id on the request, where @CurrentUser() finds it.
// Any failure answers 401 UNAUTHORIZED before the route code runs.
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokens: TokensService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();

    const token = request.cookies?.[ACCESS_COOKIE] as string | undefined;
    if (!token) throw new AppError('UNAUTHORIZED', 'Please log in', 401);

    const payload = await this.tokens.verifyAccessToken(token);
    request.user = { id: payload.sub };
    return true;
  }
}
