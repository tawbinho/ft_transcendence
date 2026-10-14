import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Match } from '../../matches/entities/match.entity.js';
import { Tournament } from '../../tournaments/entities/tournament.entity.js';
import { User } from '../../users/entities/user.entity.js';
import {
  MESSAGE_KINDS,
  SYSTEM_EVENTS,
  type MessageKind,
  type SystemEvent,
} from '../chat.constants.js';

// WHY THIS FILE EXISTS
// The `messages` table: every message of every private conversation, kept as
// history. A message is stored ONCE, with the two players of its conversation
// in order (user_low_id < user_high_id, like `friendships`), so both players
// read the same row and "the conversation between A and B" is one lookup.
// `sender_id` says who wrote it (empty for a message written by the server).
//
// The CHECK constraints say what each kind of message must contain, so even a
// bug in the code cannot store an empty text message, an invitation without a
// match, or a "system" message that claims a player wrote it.
@Entity('messages')
// Reading a conversation, newest first, page by page.
@Index(['userLowId', 'userHighId', 'createdAt', 'id'])
@Check('"user_low_id" < "user_high_id"')
@Check('"sender_id" IS NULL OR "sender_id" IN ("user_low_id", "user_high_id")')
@Check(
  `"kind" <> 'text' OR ("sender_id" IS NOT NULL AND char_length("body") BETWEEN 1 AND 500)`,
)
@Check(
  `"kind" <> 'invite' OR ("sender_id" IS NOT NULL AND "match_id" IS NOT NULL AND "body" = '')`,
)
@Check(
  `"kind" <> 'system' OR ("sender_id" IS NULL AND "event" IS NOT NULL AND "body" = '')`,
)
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // The two players of the conversation, smaller id first. Deleting a user
  // deletes their conversations.
  @Column({ name: 'user_low_id', type: 'uuid' })
  userLowId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_low_id' })
  userLow: Relation<User>;

  @Column({ name: 'user_high_id', type: 'uuid' })
  userHighId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_high_id' })
  userHigh: Relation<User>;

  // null: written by the server.
  @Column({ name: 'sender_id', type: 'uuid', nullable: true })
  senderId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_id' })
  sender: Relation<User> | null;

  @Column({ type: 'enum', enum: [...MESSAGE_KINDS], default: 'text' })
  kind: MessageKind;

  // The text; empty for invitations and system messages.
  @Column({ type: 'text', default: '' })
  body: string;

  // Invitations and tournament notices: the match to open.
  @Column({ name: 'match_id', type: 'uuid', nullable: true })
  matchId: string | null;

  @ManyToOne(() => Match, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'match_id' })
  match: Relation<Match> | null;

  // Tournament notices: the tournament to open.
  @Column({ name: 'tournament_id', type: 'uuid', nullable: true })
  tournamentId: string | null;

  @ManyToOne(() => Tournament, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tournament_id' })
  tournament: Relation<Tournament> | null;

  // System messages: what happened.
  @Column({ type: 'enum', enum: [...SYSTEM_EVENTS], nullable: true })
  event: SystemEvent | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
