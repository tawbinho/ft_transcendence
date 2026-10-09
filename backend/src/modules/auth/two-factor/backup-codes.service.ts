import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import type { Env } from '../../../config/env.validation.js';
import { TwoFactorBackupCode } from '../../users/entities/two-factor-backup-code.entity.js';
import {
  BACKUP_CODE_COUNT,
  formatCode,
  generateCode,
  hashCode,
  normalizeCode,
} from './backup-code.js';

// WHY THIS FILE EXISTS
// The database side of 2FA backup codes: making a fresh list, using a code
// once, counting what is left. The rules about WHEN a backup code may be used
// (login, turning 2FA off...) are in TwoFactorService.
@Injectable()
export class BackupCodesService {
  // The same secret key that encrypts the TOTP secrets: it lives only in the
  // environment, never in the database.
  private readonly key: Buffer;

  constructor(
    @InjectRepository(TwoFactorBackupCode)
    private readonly codes: Repository<TwoFactorBackupCode>,
    config: ConfigService<Env, true>,
  ) {
    this.key = Buffer.from(config.get('TWO_FACTOR_KEY', { infer: true }), 'hex');
  }

  // Throws away every code the user had (used or not) and makes 10 new ones.
  // Returns them in the form to show: this is the ONLY time they exist in
  // clear; only their keyed hashes are stored. One transaction: the user is
  // never left with half a list.
  async replaceAll(userId: string): Promise<string[]> {
    const plain = Array.from({ length: BACKUP_CODE_COUNT }, generateCode);
    await this.codes.manager.transaction(async (manager) => {
      await manager.delete(TwoFactorBackupCode, { userId });
      await manager.insert(
        TwoFactorBackupCode,
        plain.map((code) => ({ userId, codeHash: hashCode(code, this.key) })),
      );
    });
    return plain.map(formatCode);
  }

  // Uses a typed code. True if it was a real, unused code of this user, which
  // is now spent. The UPDATE only matches while `used_at` is still empty, so if
  // two requests send the same code at the same moment, exactly one of them
  // changes a row and wins.
  async consume(userId: string, typed: string): Promise<boolean> {
    const code = normalizeCode(typed);
    if (!code) return false;
    const result = await this.codes.update(
      { userId, codeHash: hashCode(code, this.key), usedAt: IsNull() },
      { usedAt: new Date() },
    );
    return (result.affected ?? 0) > 0;
  }

  // How many codes the user can still use.
  remaining(userId: string): Promise<number> {
    return this.codes.countBy({ userId, usedAt: IsNull() });
  }

  removeAll(userId: string): Promise<unknown> {
    return this.codes.delete({ userId });
  }
}
