import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

// The logged-in user as the guard describes it: just the id from the token.
// Load the full user from the database only when a route really needs it.
export interface AuthenticatedUser {
  id: string;
}

// WHY THIS FILE EXISTS
// Lets a controller on a protected route ask for the logged-in user:
//   me(@CurrentUser() user: AuthenticatedUser) { ... }
// It reads `request.user`, which SessionGuard filled in. Use it only on
// routes that have the guard.
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: AuthenticatedUser }>();
    return request.user;
  },
);
