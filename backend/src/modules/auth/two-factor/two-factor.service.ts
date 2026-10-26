import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppError } from '../../../common/errors/app-error.js';
import { TwoFactor } from '../../users/entities/two-factor.entity.js';
import { MailService } from '../email/mail.service.js';
import { checkCode, newVerificationCode } from '../email/verification-code.js';

// All the two-factor rules live here: sending the emailed 6-digit code, turning
// 2FA on and off, and checking the code.
@Injectable()
export class TwoFactorService {
  constructor(
    @InjectRepository(TwoFactor)
    private readonly twoFactor: Repository<TwoFactor>,
    private readonly mail: MailService,
  ) {}

  // Used at login: does this user have to give a code?
  async isEnabled(userId: string): Promise<boolean> {
    const row = await this.twoFactor.findOneBy({ userId });
    return row?.enabled === true;
  }

  // Emails a fresh 6-digit code to the user. Used to turn 2FA on and to prove
  // it is really them before turning it off.
  async sendCode(userId: string, email: string): Promise<void> {
    const existing = await this.twoFactor.findOneBy({ userId });
    const { code, hash, expiresAt } = newVerificationCode(userId);
    await this.twoFactor.save({
      userId,
      enabled: existing?.enabled ?? false,
      codeHash: hash,
      codeExpiresAt: expiresAt,
      codeAttempts: 0,
    });
    await this.mail.sendTwoFactorAuth(email, code);
  }

  // The user sends the code we emailed. If it is valid, 2FA becomes active.
  async enable(userId: string, code: string): Promise<void> {
    const row = await this.twoFactor.findOneBy({ userId });
    if (!row || row.enabled) {
      throw new AppError(
        'TWO_FACTOR_NOT_PENDING',
        'Ask for a code first, or two-factor is already enabled',
        409,
      );
    }
    await this.checkCode(row, code);
    await this.twoFactor.update({ userId }, { enabled: true });
  }

  // Needs a valid code, so a stolen session cannot silently switch 2FA off.
  async disable(userId: string, code: string): Promise<void> {
    const row = await this.twoFactor.findOneBy({ userId });
    if (!row?.enabled) {
      throw new AppError(
        'TWO_FACTOR_NOT_ENABLED',
        'Two-factor authentication is not enabled',
        409,
      );
    }
    await this.checkCode(row, code);
    await this.twoFactor.delete({ userId });
  }

  // The one place a code is checked. Throws if it is wrong, expired, locked
  // after too many guesses, or was already used.
  private async checkCode(row: TwoFactor, code: string): Promise<void> {
    const result = checkCode(
      { hash: row.codeHash, expiresAt: row.codeExpiresAt, attempts: row.codeAttempts },
      row.userId,
      code,
    );
    if (result !== 'ok') {
      if (result === 'wrong') {
        await this.twoFactor.update({ userId: row.userId }, { codeAttempts: row.codeAttempts + 1 });
      }
      throw this.invalidCode();
    }
    // Single use. The WHERE clause only matches while the code is still there,
    // so two simultaneous requests cannot both succeed.
    const used = await this.twoFactor.update(
      { userId: row.userId, codeHash: row.codeHash! },
      { codeHash: null, codeExpiresAt: null, codeAttempts: 0 },
    );
    if (used.affected === 0) throw this.invalidCode();
  }

  private invalidCode(): AppError {
    return new AppError(
      'INVALID_2FA_CODE',
      'The code is incorrect or has expired',
      400,
    );
  }
}
