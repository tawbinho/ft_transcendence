import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, type Observable } from 'rxjs';

// WHY THIS FILE EXISTS
// Controllers just `return` their value. This interceptor sits around every
// route and wraps the result as { "data": <value> }, the success shape the
// frontend (lib/api.ts) expects. Errors never come through here: they go to
// the exception filter instead.
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, { data: T }> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<{ data: T }> {
    // `undefined` (a route that returns nothing) becomes `null`, because
    // JSON cannot carry `undefined` and the frontend always reads `data`.
    return next.handle().pipe(map((data) => ({ data: data ?? (null as T) })));
  }
}
