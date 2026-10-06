import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../../config/env.validation.js';

// WHY THIS FILE EXISTS
// A TOTP secret must be READABLE by the server (it recomputes the user's
// 6-digit code from it), so unlike a password it cannot be hashed. Instead
// it is ENCRYPTED before it goes into the database, with a key that lives
// only in the environment (TWO_FACTOR_KEY). A leaked database then contains
// only ciphertext.
//
// AES-256-GCM: encrypts AND authenticates. If anyone edits the stored value,
// decrypt() throws instead of returning garbage. A fresh random IV per
// encryption means the same secret never produces the same ciphertext twice.
//
// Stored format: "v1.<iv>.<authTag>.<ciphertext>", each part base64url.
// "v1" lets us change the scheme later without breaking old rows.
@Injectable()
export class SecretCipher {
  private readonly key: Buffer;

  constructor(config: ConfigService<Env, true>) {
    // 64 hex characters = 32 bytes = a 256-bit key (checked at startup).
    this.key = Buffer.from(config.get('TWO_FACTOR_KEY', { infer: true }), 'hex');
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(12); // 96 bits: the size GCM is designed for
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return ['v1', iv, tag, ciphertext]
      .map((part) => (typeof part === 'string' ? part : part.toString('base64url')))
      .join('.');
  }

  // Throws if the value was tampered with, or was encrypted with another key.
  decrypt(stored: string): string {
    const [version, iv, tag, ciphertext] = stored.split('.');
    if (version !== 'v1' || !iv || !tag || !ciphertext) {
      throw new Error('Unsupported encrypted value format');
    }
    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.key,
      Buffer.from(iv, 'base64url'),
    );
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertext, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  }
}
