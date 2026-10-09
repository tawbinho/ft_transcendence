import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
  Unique,
} from 'typeorm';
import { Match } from '../../matches/entities/match.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { Tournament } from './tournament.entity.js';

// WHY THIS FILE EXISTS
// The `tournament_pairings` table: the bracket. One row per pairing ("slot"):
// who meets whom in which round, which match they play, and who won. The shape
// of the bracket (which slot feeds which) is in bracket.ts.
//
// A slot is identified by (tournament, round, position): round 0 is the first
// round. Players are empty while a slot waits for the winners of earlier
// pairings, and the second player stays empty for a bye.
@Entity('tournament_pairings')
@Unique(['tournamentId', 'round', 'position'])
@Check('"round" >= 0 AND "position" >= 0')
@Check('"player1_id" <> "player2_id"')
@Check('"winner_id" IS NULL OR "winner_id" IN ("player1_id", "player2_id")')
export class TournamentPairing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Cancelling (deleting) a tournament deletes its bracket too.
  @Column({ name: 'tournament_id', type: 'uuid' })
  tournamentId: string;

  @ManyToOne(() => Tournament, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tournament_id' })
  tournament: Relation<Tournament>;

  @Column({ type: 'smallint' })
  round: number;

  @Column({ type: 'smallint' })
  position: number;

  // RESTRICT on the users, like everywhere a player appears in a result.
  @Column({ name: 'player1_id', type: 'uuid', nullable: true })
  player1Id: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'player1_id' })
  player1: Relation<User> | null;

  @Column({ name: 'player2_id', type: 'uuid', nullable: true })
  player2Id: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'player2_id' })
  player2: Relation<User> | null;

  // The match played for this pairing. Indexed: when a match ends, we find its
  // pairing from here. A draw replaces it with a new match.
  @Index()
  @Column({ name: 'match_id', type: 'uuid', nullable: true })
  matchId: string | null;

  @ManyToOne(() => Match, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'match_id' })
  match: Relation<Match> | null;

  @Column({ name: 'winner_id', type: 'uuid', nullable: true })
  winnerId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'winner_id' })
  winner: Relation<User> | null;

  // One player had no opponent and went through without playing.
  @Column({ type: 'boolean', default: false })
  bye: boolean;
}
