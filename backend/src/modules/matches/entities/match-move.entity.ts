import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { Match } from './match.entity.js';

// WHY THIS FILE EXISTS
// The `match_moves` table: every move of every match, in order. The board is
// never stored: the engine rebuilds it by replaying these moves. That is what
// makes reconnecting, spectating and match history simple, and it means the
// stored game can never disagree with the rules.
// The primary key is (match, ply): a move number can only exist once, so even
// two simultaneous requests cannot both store "move 5".
@Entity('match_moves')
@Check('"ply" >= 1')
@Check('"seat" IN (1, 2)')
@Check('"col" >= 0')
export class MatchMove {
  @PrimaryColumn({ name: 'match_id', type: 'uuid' })
  matchId: string;

  // The move number, starting at 1.
  @PrimaryColumn({ type: 'smallint' })
  ply: number;

  // Deleting a match deletes its moves.
  @ManyToOne(() => Match, (match) => match.moves, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'match_id' })
  match: Relation<Match>;

  // Who played it (1 or 2). Always the same as the turn order, but kept so a
  // reader of the table does not have to compute it.
  @Column({ type: 'smallint' })
  seat: number;

  // The column the disc was dropped in (from 0).
  @Column({ type: 'smallint' })
  col: number;

  @CreateDateColumn({ name: 'played_at', type: 'timestamptz' })
  playedAt: Date;
}
