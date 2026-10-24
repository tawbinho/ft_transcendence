import {
  Check,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';

// The `blocks` table: "blocker does not want to hear from blocked". The pair is
// the primary key, so blocking twice is not possible.
@Entity('blocks')
@Check('"blocker_id" <> "blocked_id"')
export class Block {
  @PrimaryColumn({ name: 'blocker_id', type: 'uuid' })
  blockerId: string;

  // Indexed because "is this player blocked by anyone I deal with" looks it up
  // from this side.
  @Index()
  @PrimaryColumn({ name: 'blocked_id', type: 'uuid' })
  blockedId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blocker_id' })
  blocker: Relation<User>;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blocked_id' })
  blocked: Relation<User>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
