import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppError } from '../../../common/errors/app-error.js';
import { TwoFactor } from '../../users/entities/two-factor.entity.js';
import { looksLikeBackupCode } from './backup-code.js';
import { BackupCodesService } from './backup-codes.service.js';
import { MailService } from '../email/mail.service.js';
import { checkCode, newVerificationCode } from '../email/verification-code.js';

// All the two-factor rules live here: sending the emailed 6-digit code, turning
// 2FA on and off, and checking a code (emailed or backup).
@Injectable()
export class TwoFactorService {
  constructor(
    @InjectRepository(TwoFactor)
    private readonly twoFactor: Repository<TwoFactor>,
    private readonly mail: MailService,
    private readonly backupCodes: BackupCodesService,
  ) {}

  // Used at login: does this user have to give a code?
  async isEnabled(userId: string): Promise<boolean> {
    const row = await this.twoFactor.findOneBy({ userId });
    return row?.enabled === true;
  }

  // Emails a fresh 6-digit code to the user. Used to turn 2FA on and to prove
  // it is really them before turning it off or resetting the backup codes.
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
  async enable(userId: string, code: string): Promise<string[]> {
    const row = await this.twoFactor.findOneBy({ userId });
    if (!row || row.enabled) {
      throw new AppError(
        'TWO_FACTOR_NOT_PENDING',
        'Ask for a code first, or two-factor is already enabled',
        409,
      );
    }
    // Only the emailed code here: no backup codes exist before 2FA is on.
    await this.checkCode(row, code, { allowBackup: false });
    await this.twoFactor.update({ userId }, { enabled: true });
    return this.backupCodes.replaceAll(userId);
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
    await this.backupCodes.removeAll(userId); // 2FA is off: the codes are useless
  }

  // A new list of backup codes; the old ones stop working. Needs a valid code
  // (emailed or backup), so a stolen session cannot read or reset them.
  async regenerateBackupCodes(userId: string, code: string): Promise<string[]> {
    const row = await this.requireEnabled(userId);
    await this.checkCode(row, code);
    return this.backupCodes.replaceAll(userId);
  }

  // How many backup codes are left, so the app can tell the user to make new
  // ones before they run out.
  async backupCodesRemaining(userId: string): Promise<number> {
    await this.requireEnabled(userId);
    return this.backupCodes.remaining(userId);
  }

  private async requireEnabled(userId: string): Promise<TwoFactor> {
    const row = await this.twoFactor.findOneBy({ userId });
    if (!row?.enabled) {
      throw new AppError(
        'TWO_FACTOR_NOT_ENABLED',
        'Two-factor authentication is not enabled',
        409,
      );
    }
    return row;
  }

  // Second stage of login: the password was already correct, now the code.
  async verifyLoginCode(userId: string, code: string): Promise<void> {
    const row = await this.twoFactor.findOneBy({ userId });
    if (!row?.enabled) {
      throw new AppError(
        'TWO_FACTOR_NOT_ENABLED',
        'Two-factor authentication is not enabled',
        409,
      );
    }
    await this.checkCode(row, code);
  }

  // The one place a code is checked. Throws if it is wrong, expired, locked
  // after too many guesses, or was already used.
  private async checkCode(
    row: TwoFactor,
    code: string,
    options: { allowBackup?: boolean } = {},
  ): Promise<void> {
    if (looksLikeBackupCode(code)) {
      if (options.allowBackup !== false && (await this.backupCodes.consume(row.userId, code))) {
        return;
      }
      throw this.invalidCode();
    }

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
