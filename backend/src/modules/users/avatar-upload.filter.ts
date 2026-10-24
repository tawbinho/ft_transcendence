import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  PayloadTooLargeException,
} from '@nestjs/common';
import type { Response } from 'express';

// The upload library (multer) refuses a file that is too big, or a body that is
// not a proper multipart form, BEFORE our code runs, with generic errors.
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
