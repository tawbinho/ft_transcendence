import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { User } from './user.entity.js';

// WHY THIS FILE EXISTS
// The `two_factor` table: the authenticator-app (TOTP) setup of a user.
// At most one row per user, so the user id is the primary key as well as the
// foreign key. No row means the user never started 2FA.
@Entity('two_factor')
export class TwoFactor {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  // One row <-> one user. Deleting the user deletes their 2FA setup.
  @OneToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  // The shared secret behind the QR code. It must be stored ENCRYPTED by the
  // service before it reaches this column; this class does not do it.
  @Column({ type: 'text' })
  secret: string;

  // false after setup, true once the user proved their app works with a
  // valid code. Login only asks for a code when this is true.
  @Column({ type: 'boolean', default: false })
  enabled: boolean;

  // Replay protection. A TOTP code is valid for a 30-second slot; this stores
  // the number of the last slot whose code was accepted. A code from that
  // slot or an earlier one is rejected, so a code someone saw cannot be
  // reused. null until the first successful verification.
  @Column({ name: 'last_used_step', type: 'integer', nullable: true })
  lastUsedStep: number | null;
}
