import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  PayloadTooLargeException,
} from '@nestjs/common';
import type { Response } from 'express';

// WHY THIS FILE EXISTS
// The upload library (multer) refuses a file that is too big, or a body that
// is not a proper multipart form, BEFORE our code runs, with generic errors.
// This filter, used only on the avatar upload route, turns them into the
// error codes of the API design: AVATAR_TOO_LARGE (413) and VALIDATION_ERROR
// (400).
@Catch(PayloadTooLargeException, BadRequestException)
export class AvatarUploadFilter implements ExceptionFilter {
  catch(
    exception: PayloadTooLargeException | BadRequestException,
    host: ArgumentsHost,
  ): void {
    const response = host.switchToHttp().getResponse<Response>();
    if (exception instanceof PayloadTooLargeException) {
      response.status(413).json({
        error: {
          code: 'AVATAR_TOO_LARGE',
          message: 'The picture is too large (2 MB at most)',
        },
      });
      return;
    }
    response.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Send the picture as a form file in the "avatar" field',
      },
    });
  }
}
