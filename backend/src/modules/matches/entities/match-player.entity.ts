import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
  type Relation,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { PLAYER_RESULTS, type PlayerResult } from '../match.constants.js';
import { Match } from './match.entity.js';

// WHY THIS FILE EXISTS
// The `match_players` table: who sits in which seat of a match, and how the
// match ended for them. A match has one row per player (two once it started).
// The primary key is (match, seat): a seat can only be taken once. The
// winner of a match is read from `result` and nowhere else.
@Entity('match_players')
// A user cannot play against themselves in the same match.
@Unique(['matchId', 'userId'])
@Check('"seat" IN (1, 2)')
export class MatchPlayer {
  @PrimaryColumn({ name: 'match_id', type: 'uuid' })
  matchId: string;

  // 1 plays first, 2 plays second.
  @PrimaryColumn({ type: 'smallint' })
  seat: number;

  // Deleting a match deletes its player rows.
  @ManyToOne(() => Match, (match) => match.players, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'match_id' })
  match: Relation<Match>;

  // Indexed because "my matches" (history) looks matches up by user.
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  // RESTRICT: a user who has played cannot be deleted by accident and leave a
  // match half empty. How to handle account deletion (anonymising the player)
  // is a later decision.
  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  // null while the match is not over. See match.constants.ts.
  @Column({ type: 'enum', enum: [...PLAYER_RESULTS], nullable: true })
  result: PlayerResult | null;
}
