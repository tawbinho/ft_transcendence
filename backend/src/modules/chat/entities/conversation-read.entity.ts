import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';

// The `conversation_reads` table: "user has read everything their peer sent up
// to read_at". One row per (user, peer).
@Entity('conversation_reads')
@Check('"user_id" <> "peer_id"')
export class ConversationRead {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @PrimaryColumn({ name: 'peer_id', type: 'uuid' })
  peerId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'peer_id' })
  peer: Relation<User>;

  @Column({ name: 'read_at', type: 'timestamptz' })
  readAt: Date;
}
