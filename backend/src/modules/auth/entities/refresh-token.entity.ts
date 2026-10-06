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
// The `refresh_tokens` table. The short access token (a JWT) cannot be
// revoked, so logging in also issues a long-lived refresh token whose only
// job is to get new access tokens. Because refresh tokens live in this table,
// the server CAN revoke them: that is what makes logout real.
// One row = one issued refresh token. A user has several rows when logged in
// on several devices.
@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  // Deleting a user deletes their tokens.
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  // SHA-256 of the token. We never store the token itself: if the database
  // leaks, the hashes cannot be used to log in.
  @Column({ name: 'token_hash', type: 'text', unique: true })
  tokenHash: string;

  // All tokens obtained by rotating one login share a family id. If an OLD
  // token of a family is used again (it was stolen), the whole family is
  // revoked at once.
  @Index()
  @Column({ name: 'family_id', type: 'uuid' })
  familyId: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  // Set when the token was used (rotated) or when the user logged out.
  // null = still usable.
  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
