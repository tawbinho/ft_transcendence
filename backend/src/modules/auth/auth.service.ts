import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { QueryFailedError } from 'typeorm';
import { AppError } from '../../common/errors/app-error.js';
import { toPublicUser, type PublicUser } from '../users/public-user.js';
import { UsersService } from '../users/users.service.js';
import type { SignupDto } from './dto/signup.dto.js';

// WHY THIS FILE EXISTS
// The business rules of authentication live here, not in the controller.
// For now: signup. Login and sessions come next.
@Injectable()
export class AuthService {
  constructor(private readonly users: UsersService) {}

  async signup(dto: SignupDto): Promise<PublicUser> {
    // 1. Friendly early check. The email was already trimmed and lowercased
    //    by the DTO, so "A@x.com" and "a@x.com" are the same account.
    if (await this.users.findByEmail(dto.email)) {
      throw new AppError('EMAIL_TAKEN', 'This email is already registered', 409);
    }
    if (await this.users.findByDisplayName(dto.displayName)) {
      throw new AppError(
        'DISPLAY_NAME_TAKEN',
        'This display name is already taken',
        409,
      );
    }

    // 2. Never store the password: store its argon2 hash. The hash includes
    //    a random salt and its own settings, so it can be verified later.
    const passwordHash = await argon2.hash(dto.password);

    // 3. Save. The checks above are not atomic: two simultaneous signups can
    //    both pass them. The database unique constraints are the real
    //    guarantee, so a violation is turned into the same friendly error.
    try {
      const user = await this.users.create({
        email: dto.email,
        displayName: dto.displayName,
        passwordHash,
      });
      return toPublicUser(user);
    } catch (error) {
      throw this.translateUniqueViolation(error) ?? error;
    }
  }

  // Postgres error code 23505 = unique_violation. Its `detail` names the
  // column, for example: Key (email)=(a@x.com) already exists.
  private translateUniqueViolation(error: unknown): AppError | null {
    if (!(error instanceof QueryFailedError)) return null;
    const driverError = error.driverError as { code?: string; detail?: string };
    if (driverError.code !== '23505') return null;
    if (driverError.detail?.includes('(email)')) {
      return new AppError('EMAIL_TAKEN', 'This email is already registered', 409);
    }
    if (driverError.detail?.includes('(display_name)')) {
      return new AppError(
        'DISPLAY_NAME_TAKEN',
        'This display name is already taken',
        409,
      );
    }
    return null;
  }
}
