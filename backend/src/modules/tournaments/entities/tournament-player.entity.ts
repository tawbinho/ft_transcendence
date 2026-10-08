import {
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { Tournament } from './tournament.entity.js';

// WHY THIS FILE EXISTS
// The `tournament_players` table: who registered in which tournament. One row
// per player per tournament. The primary key is (tournament, user), so nobody
// can register twice, even if two requests arrive at the same instant. The
// order of registration is `joined_at`.
@Entity('tournament_players')
export class TournamentPlayer {
  @PrimaryColumn({ name: 'tournament_id', type: 'uuid' })
  tournamentId: string;

  // Deleting a tournament (cancelling it) deletes its registrations.
  @ManyToOne(() => Tournament, (tournament) => tournament.players, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tournament_id' })
  tournament: Relation<Tournament>;

  // Indexed because "is the viewer registered?" looks rows up by user.
  @Index()
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  // RESTRICT, like the match players: a registered user cannot be deleted.
  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @CreateDateColumn({ name: 'joined_at', type: 'timestamptz' })
  joinedAt: Date;
}
