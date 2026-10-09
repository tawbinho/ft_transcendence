import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppError } from '../../common/errors/app-error.js';
import type { Env } from '../../config/env.validation.js';
import { detectImageType } from './avatar-image.js';
import type { User } from './entities/user.entity.js';
import {
  AVATAR_FILE_PATTERN,
  AVATAR_MAX_BYTES,
  AVATAR_URL_PREFIX,
} from './user.constants.js';
import { UsersService } from './users.service.js';

// What the upload library hands us: the file, in memory.
export interface UploadedImage {
  buffer: Buffer;
  size: number;
}

// WHY THIS FILE EXISTS
// Profile pictures: checks an uploaded file, stores it in the avatar folder
// (a Docker volume) under a NEW random name every time, and keeps
// `users.avatar_url` pointing at it. A new name per picture means a browser
// never shows an old cached copy.
@Injectable()
export class AvatarService {
  private readonly logger = new Logger(AvatarService.name);

  constructor(
    private readonly users: UsersService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  // The folder pictures are stored in.
  get directory(): string {
    return this.config.get('AVATAR_DIR', { infer: true });
  }

  // Replaces the picture of a user. Returns the updated user.
  async set(userId: string, file: UploadedImage | undefined): Promise<User> {
    if (!file) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Send the picture as a form file in the "avatar" field',
        400,
      );
    }
    if (file.size > AVATAR_MAX_BYTES) {
      throw new AppError(
        'AVATAR_TOO_LARGE',
        'The picture is too large (2 MB at most)',
        413,
      );
    }
    // The CONTENT decides, not the type the browser declared.
    const type = detectImageType(file.buffer);
    if (!type) {
      throw new AppError(
        'AVATAR_INVALID_TYPE',
        'The picture must be a PNG, JPEG or WebP image',
        415,
      );
    }

    const user = await this.users.findById(userId);
    if (!user) throw new AppError('USER_NOT_FOUND', 'User not found', 404);

    const name = `${randomUUID()}.${type.ext}`;
    await mkdir(this.directory, { recursive: true });
    await writeFile(join(this.directory, name), file.buffer);

    try {
      await this.users.setAvatarUrl(userId, AVATAR_URL_PREFIX + name);
    } catch (error) {
      // The database refused: do not leave an orphan file behind.
      await this.removeFile(name);
      throw error;
    }
    await this.removeStored(user.avatarUrl);
    user.avatarUrl = AVATAR_URL_PREFIX + name;
    return user;
  }

  // Back to the default avatar. Returns the updated user.
  async remove(userId: string): Promise<User> {
    const user = await this.users.findById(userId);
    if (!user) throw new AppError('USER_NOT_FOUND', 'User not found', 404);

    await this.users.setAvatarUrl(userId, null);
    await this.removeStored(user.avatarUrl);
    user.avatarUrl = null;
    return user;
  }

  // Deletes the file an `avatar_url` points to (nothing to do for null).
  private async removeStored(avatarUrl: string | null): Promise<void> {
    if (!avatarUrl?.startsWith(AVATAR_URL_PREFIX)) return;
    await this.removeFile(avatarUrl.slice(AVATAR_URL_PREFIX.length));
  }

  // Best effort: a file that cannot be deleted only wastes a little space, it
  // must not fail the request.
  private async removeFile(name: string): Promise<void> {
    if (!AVATAR_FILE_PATTERN.test(name)) return;
    try {
      await unlink(join(this.directory, name));
    } catch (error) {
      this.logger.warn(`Could not delete picture ${name}: ${String(error)}`);
    }
  }
}
