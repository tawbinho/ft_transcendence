import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

// WHY THIS FILE EXISTS
// The rate limiter is registered for the whole app, but it only knows how to
// read an HTTP request (the client address, the response headers). Live
// (WebSocket) messages go through the same global guards, so without this the
// limiter would crash on them. HTTP requests are limited exactly as before.
@Injectable()
export class HttpThrottlerGuard extends ThrottlerGuard {
  canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return Promise.resolve(true);
    return super.canActivate(context);
  }
}
