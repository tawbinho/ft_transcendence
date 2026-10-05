import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { AppError } from '../errors/app-error.js';

// WHY THIS FILE EXISTS
// Every error, whatever its origin, leaves the API in one shape:
//   { "error": { "code": "EMAIL_TAKEN", "message": "..." } }
// which is what the frontend (lib/api.ts) reads. `@Catch()` with no argument
// means "catch everything".

// Fallback codes for errors that did not come from our own AppError.
const CODE_BY_STATUS: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    // 1. Our own business errors: use the code and status they carry.
    if (exception instanceof AppError) {
      response
        .status(exception.status)
        .json({ error: { code: exception.code, message: exception.message } });
      return;
    }

    // 2. Errors raised by Nest itself: unknown route (404), a failed
    //    validation (400), a guard refusing access (401/403)...
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      // The validation pipe sends `message` as a list of problems.
      const rawMessage =
        typeof body === 'object' && body !== null && 'message' in body
          ? (body as { message: unknown }).message
          : exception.message;
      const isValidation = status === 400 && Array.isArray(rawMessage);
      const message = Array.isArray(rawMessage)
        ? rawMessage.join('; ')
        : String(rawMessage);

      response.status(status).json({
        error: {
          code: isValidation
            ? 'VALIDATION_ERROR'
            : (CODE_BY_STATUS[status] ?? 'HTTP_ERROR'),
          message,
        },
      });
      return;
    }

    // 3. Anything else is a bug. Log the details for us, but send the client
    //    a generic answer so no internals (stack traces, SQL) leak out.
    this.logger.error(
      exception instanceof Error ? exception.stack : String(exception),
    );
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
    });
  }
}
