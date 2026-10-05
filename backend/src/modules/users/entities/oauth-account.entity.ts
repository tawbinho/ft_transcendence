import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  type Relation,
} from 'typeorm';
import { User } from './user.entity.js';

// WHY THIS FILE EXISTS
// The `oauth_accounts` table: one row per external login (Google, GitHub,
// 42...) linked to one of our users. A user can have several.
// The same external account can never be linked twice, hence the unique pair.
@Entity('oauth_accounts')
@Unique(['provider', 'providerAccountId'])
export class OAuthAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // The foreign key column. Indexed because we look accounts up by user.
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  // Many OAuth accounts -> one user. If the user is deleted, their linked
  // accounts are deleted with them (CASCADE).
  // `Relation<>` is needed because this project uses ES modules, where
  // decorator metadata would otherwise reference the class too early.
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  // Which provider: 'google', 'github', '42'...
  @Column({ type: 'text' })
  provider: string;

  // The user's id on that provider's side.
  @Column({ name: 'provider_account_id', type: 'text' })
  providerAccountId: string;
}
