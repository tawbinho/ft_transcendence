import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import {
  DEFAULT_THEME,
  MATCH_END_REASONS,
  MATCH_STATUSES,
  type MatchEndReason,
  type MatchStatus,
} from '../match.constants.js';
import { MatchMove } from './match-move.entity.js';
import { MatchPlayer } from './match-player.entity.js';

// WHY THIS FILE EXISTS
// The `matches` table: one row per game. It stores the settings and the
// lifecycle (waiting, in progress, finished). It does NOT store the board:
// the board is rebuilt from the moves (see MatchMove) with the engine, so the
// database can never disagree with the rules.
//
// The CHECK constraints are a last line of defence: even a bug in the code
// cannot store a board size or win length the engine would refuse.
@Entity('matches')
@Check('"cols" BETWEEN 3 AND 12')
@Check('"rows" BETWEEN 3 AND 12')
@Check('"win_length" >= 3 AND "win_length" <= LEAST("cols", "rows")')
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Indexed because lobbies and "active matches" queries filter on it.
  @Index()
  @Column({ type: 'enum', enum: [...MATCH_STATUSES], default: 'waiting' })
  status: MatchStatus;

  // null until the match ends.
  @Column({
    name: 'end_reason',
    type: 'enum',
    enum: [...MATCH_END_REASONS],
    nullable: true,
  })
  endReason: MatchEndReason | null;

  // The rules of this game (the engine's GameSettings) plus the theme.
  @Column({ type: 'smallint' })
  cols: number;

  @Column({ type: 'smallint' })
  rows: number;

  @Column({ name: 'win_length', type: 'smallint' })
  winLength: number;

  @Column({ type: 'text', default: DEFAULT_THEME })
  theme: string;

  // When set, only this user may join the match (an invitation to a friend).
  // If that user is deleted, the match simply becomes open.
  @Column({ name: 'invited_user_id', type: 'uuid', nullable: true })
  invitedUserId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'invited_user_id' })
  invitedUser: Relation<User> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  // Set when the second player joins.
  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  // Set when the match finishes or is abandoned.
  @Column({ name: 'ended_at', type: 'timestamptz', nullable: true })
  endedAt: Date | null;

  @OneToMany(() => MatchPlayer, (player) => player.match)
  players: Relation<MatchPlayer[]>;

  @OneToMany(() => MatchMove, (move) => move.match)
  moves: Relation<MatchMove[]>;
}
