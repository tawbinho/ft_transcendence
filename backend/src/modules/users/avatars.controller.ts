import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { AppError } from '../../common/errors/app-error.js';
import { AvatarService } from './avatar.service.js';
import { AVATAR_FILE_PATTERN } from './user.constants.js';

// WHY THIS FILE EXISTS
// Serves the stored profile pictures at GET /api/avatars/<file>. The proxy
// only forwards /api and /socket.io to the backend, which is why they live
// under /api. No login needed: the file names are random and unguessable, and
// a picture shown in the page must load in a plain <img>.
@ApiTags('users')
@Controller('avatars')
export class AvatarsController {
  constructor(private readonly avatars: AvatarService) {}

  // SkipThrottle: a page of 20 players loads 20 pictures at once, which would
  // otherwise eat the 100 requests a minute of a normal user.
  @SkipThrottle()
  @Get(':file')
  @ApiOperation({ summary: 'A profile picture (the file, not JSON)' })
  @ApiProduces('image/webp', 'image/png', 'image/jpeg')
  async get(@Param('file') file: string, @Res() res: Response): Promise<void> {
    // Only names WE generate are accepted: no "../" can get through.
    if (!AVATAR_FILE_PATTERN.test(file)) throw this.notFound();

    await new Promise<void>((resolve, reject) => {
      res.sendFile(
        file,
        {
          root: this.avatars.directory,
          // A picture never changes (a new picture gets a new name), so
          // browsers may keep it for a year.
          maxAge: '1y',
          immutable: true,
          headers: {
            // The browser must trust OUR content type, never guess one.
            'X-Content-Type-Options': 'nosniff',
          },
        },
        (error) => (error ? reject(this.notFound()) : resolve()),
      );
    });
  }

  private notFound(): AppError {
    return new AppError('NOT_FOUND', 'Picture not found', 404);
  }
}
