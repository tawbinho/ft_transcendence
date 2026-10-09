import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
  Unique,
} from 'typeorm';
import { User } from './user.entity.js';

// WHY THIS FILE EXISTS
// The `two_factor_backup_codes` table: the one-time codes a user can type
// instead of an authenticator code, if they lose their phone. One row per
// code. We never store a code itself, only its keyed hash (see
// auth/two-factor/backup-code.ts), so a stolen database does not give the
// codes away. `used_at` is set the first time a code works: it can never work
// again.
@Entity('two_factor_backup_codes')
@Unique(['userId', 'codeHash'])
export class TwoFactorBackupCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Indexed: every check and count looks the codes up by user.
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  // Deleting the user deletes their codes.
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @Column({ name: 'code_hash', type: 'text' })
  codeHash: string;

  // null until the code is used.
  @Column({ name: 'used_at', type: 'timestamptz', nullable: true })
  usedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
