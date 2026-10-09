import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { generateSecret, generateURI, verify } from 'otplib';
import QRCode from 'qrcode';
import { IsNull, LessThan, Repository } from 'typeorm';
import { AppError } from '../../../common/errors/app-error.js';
import { TwoFactor } from '../../users/entities/two-factor.entity.js';
import { looksLikeBackupCode } from './backup-code.js';
import { BackupCodesService } from './backup-codes.service.js';
import { SecretCipher } from './secret-cipher.js';

// Shown in the authenticator app next to the account.
const ISSUER = 'Connect Four';

// WHY THIS FILE EXISTS
// All the two-factor rules (TOTP, the 6-digit codes from an authenticator
// app) live here: starting the setup, turning 2FA on and off, and checking a
// code at login. A user who lost their phone can use a one-time BACKUP code in
// place of the 6-digit code (see backup-codes.service.ts).
@Injectable()
export class TwoFactorService {
  constructor(
    @InjectRepository(TwoFactor)
    private readonly twoFactor: Repository<TwoFactor>,
    private readonly cipher: SecretCipher,
    private readonly backupCodes: BackupCodesService,
  ) {}

  // Used at login: does this user have to give a code?
  async isEnabled(userId: string): Promise<boolean> {
    const row = await this.twoFactor.findOneBy({ userId });
    return row?.enabled === true;
  }

  // Step 1 of turning 2FA on. Creates a fresh secret, stores it ENCRYPTED
  // with enabled = false, and returns the QR code to scan. 2FA is not active
  // until the user proves their app works (see enable()). Calling setup again
  // before enabling simply replaces the unconfirmed secret.
  async setup(
    userId: string,
    accountLabel: string,
  ): Promise<{ qr: string; secret: string }> {
    const existing = await this.twoFactor.findOneBy({ userId });
    if (existing?.enabled) {
      throw new AppError(
        'TWO_FACTOR_ALREADY_ENABLED',
        'Two-factor authentication is already enabled',
        409,
      );
    }

    const secret = generateSecret(); // base32, what authenticator apps expect
    await this.twoFactor.save({
      userId,
      secret: this.cipher.encrypt(secret),
      enabled: false,
      lastUsedStep: null,
    });

    const uri = generateURI({ issuer: ISSUER, label: accountLabel, secret });
    // A data URL ("data:image/png;base64,...") the frontend can put in <img>.
    // The raw secret is returned too, for users who type it in manually
    // instead of scanning.
    return { qr: await QRCode.toDataURL(uri), secret };
  }

  // Step 2: the user sends the first code from their app. If it is valid we
  // know the app is configured correctly, so 2FA becomes active. This stops
  // people from locking themselves out with a bad scan. Returns the 10 backup
  // codes, shown ONCE: the user must keep them somewhere safe.
  async enable(userId: string, code: string): Promise<string[]> {
    const row = await this.twoFactor.findOneBy({ userId });
    if (!row || row.enabled) {
      throw new AppError(
        'TWO_FACTOR_NOT_PENDING',
        'Start the setup first, or two-factor is already enabled',
        409,
      );
    }
    // Only an app code here: no backup codes exist before 2FA is on.
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
  // (app or backup), so a stolen session cannot read or reset them.
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

  // The one place a code is checked. Throws if it is wrong, expired, or was
  // already used. The value is either the 6-digit code of the app or, unless
  // `allowBackup` is false, a one-time backup code (told apart by length).
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

    const result = await verify({
      secret: this.cipher.decrypt(row.secret),
      token: code,
      // Accept the previous and next 30-second slot too, for clock drift
      // between the phone and the server.
      epochTolerance: 30,
      // Replay protection: reject any slot at or before the last accepted one.
      afterTimeStep: row.lastUsedStep ?? undefined,
    });
    // The library's result type covers both TOTP and HOTP; only a TOTP
    // result has `timeStep`, which is the slot number we need below.
    if (!result.valid || !('timeStep' in result)) throw this.invalidCode();
    const step = result.timeStep;

    // Record the slot atomically. The WHERE clause only matches while the
    // stored step is older, so two simultaneous requests using the same code
    // cannot both succeed: the second one updates nothing.
    const recorded = await this.twoFactor.update(
      [
        { userId: row.userId, lastUsedStep: IsNull() },
        { userId: row.userId, lastUsedStep: LessThan(step) },
      ],
      { lastUsedStep: step },
    );
    if (recorded.affected === 0) throw this.invalidCode();
  }

  private invalidCode(): AppError {
    return new AppError(
      'INVALID_2FA_CODE',
      'The code is incorrect or has expired',
      400,
    );
  }
}
