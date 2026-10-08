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
import { DEFAULT_THEME } from '../../matches/match.constants.js';
import { User } from '../../users/entities/user.entity.js';
import {
  TOURNAMENT_STATUSES,
  type TournamentStatus,
} from '../tournament.constants.js';
import { TournamentPlayer } from './tournament-player.entity.js';

// WHY THIS FILE EXISTS
// The `tournaments` table: one row per tournament. It stores what the creator
// chose (name, number of places, the board every match will use) and where the
// tournament is in its life. Who registered is in TournamentPlayer.
//
// The CHECK constraints are a last line of defence: even a bug in the code
// cannot store a size other than 4 or 8, or a board the engine would refuse
// (they are the same limits as the `matches` table).
@Entity('tournaments')
@Check('"size" IN (4, 8)')
@Check('"cols" BETWEEN 3 AND 12')
@Check('"rows" BETWEEN 3 AND 12')
@Check('"win_length" >= 3 AND "win_length" <= LEAST("cols", "rows")')
export class Tournament {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  name: string;

  // Indexed because the list filters on it.
  @Index()
  @Column({
    type: 'enum',
    enum: [...TOURNAMENT_STATUSES],
    default: 'registering',
  })
  status: TournamentStatus;

  // Number of places: 4 or 8.
  @Column({ type: 'smallint' })
  size: number;

  // The board of EVERY match of this tournament (same four values as a match).
  @Column({ type: 'smallint' })
  cols: number;

  @Column({ type: 'smallint' })
  rows: number;

  @Column({ name: 'win_length', type: 'smallint' })
  winLength: number;

  @Column({ type: 'text', default: DEFAULT_THEME })
  theme: string;

  @Column({ name: 'created_by_id', type: 'uuid' })
  createdById: string;

  // RESTRICT: a user who created a tournament cannot be deleted by accident
  // (the same choice as for match players; account deletion is decided later).
  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: Relation<User>;

  // Set when the final is won (not built yet).
  @Column({ name: 'winner_id', type: 'uuid', nullable: true })
  winnerId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'winner_id' })
  winner: Relation<User> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'ended_at', type: 'timestamptz', nullable: true })
  endedAt: Date | null;

  @OneToMany(() => TournamentPlayer, (player) => player.tournament)
  players: Relation<TournamentPlayer[]>;
}
