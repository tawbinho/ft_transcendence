import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import {
  FRIENDSHIP_STATUSES,
  type FriendshipStatus,
} from '../friends.constants.js';

// WHY THIS FILE EXISTS
// The `friendships` table: a friend request, or an accepted friendship, between
// two players. There is ONE row per pair: the two ids are stored in order
// (user_low_id < user_high_id), so "A asks B" and "B asks A" can never become
// two rows. `requester_id` remembers who asked.
@Entity('friendships')
@Check('"user_low_id" < "user_high_id"')
@Check('"requester_id" IN ("user_low_id", "user_high_id")')
export class Friendship {
  @PrimaryColumn({ name: 'user_low_id', type: 'uuid' })
  userLowId: string;

  // Indexed too: "my friends" looks rows up by either side of the pair.
  @Index()
  @PrimaryColumn({ name: 'user_high_id', type: 'uuid' })
  userHighId: string;

  // Deleting a user deletes their friendships.
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_low_id' })
  userLow: Relation<User>;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_high_id' })
  userHigh: Relation<User>;

  // Who sent the request: one of the two users of the pair.
  @Column({ name: 'requester_id', type: 'uuid' })
  requesterId: string;

  @Column({ type: 'enum', enum: [...FRIENDSHIP_STATUSES], default: 'pending' })
  status: FriendshipStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  // Set when the request is accepted ("friends since").
  @Column({ name: 'accepted_at', type: 'timestamptz', nullable: true })
  acceptedAt: Date | null;
}
