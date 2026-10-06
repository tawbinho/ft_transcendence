import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';

// WHY THIS FILE EXISTS
// The `sessions` table: one row per login. After a successful login the
// server creates a row and puts a random token in an httpOnly cookie. On every
// request the server hashes that token and looks the row up: if it exists and
// has not expired, the user is logged in. Logout deletes the row, which ends
// the login immediately.
// A user has several rows when logged in on several devices.
@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Indexed because we delete all of a user's sessions at once sometimes.
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  // Deleting a user deletes their sessions.
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  // SHA-256 of the cookie's token. We never store the token itself: if the
  // database leaks, the hashes cannot be used to hijack a login.
  @Column({ name: 'token_hash', type: 'text', unique: true })
  tokenHash: string;

  // true = "the password was right but the 2FA code has not been given yet".
  // Such a session lasts only a few minutes and is refused by every normal
  // route; it is only accepted by POST /auth/2fa/verify.
  @Column({ name: 'pending_two_factor', type: 'boolean', default: false })
  pendingTwoFactor: boolean;

  // Indexed so expired rows can be deleted quickly.
  @Index()
  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
