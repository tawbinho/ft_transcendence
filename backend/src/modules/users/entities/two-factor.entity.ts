import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { User } from './user.entity.js';

// The `two_factor` table: the email-code 2FA state of a user. At most
// one row per user, so the user id is the primary key as well as the foreign
// key.
@Entity('two_factor')
export class TwoFactor {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  // One row <-> one user. Deleting the user deletes their 2FA setup.
  @OneToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  // false after the first code was asked for, true once the user proved they
  // can read their email with a valid code. Login only asks for a code when
  // this is true.
  @Column({ type: 'boolean', default: false })
  enabled: boolean;

  // The emailed code, like the email verification code: only its hash is
  // stored, it expires, and it dies after MAX_ATTEMPTS wrong guesses.
  @Column({ name: 'code_hash', type: 'text', nullable: true })
  codeHash: string | null;

  @Column({ name: 'code_expires_at', type: 'timestamptz', nullable: true })
  codeExpiresAt: Date | null;

  @Column({ name: 'code_attempts', type: 'int', default: 0 })
  codeAttempts: number;
}
