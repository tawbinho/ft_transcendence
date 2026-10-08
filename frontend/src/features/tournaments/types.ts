import type { MatchSettings } from '@/features/matches/types';
import type { UserSummary } from '@/features/users/types';

// The shapes of the tournament routes (docs/api-contract.md, "Tournaments").
//
// A tournament is a single-elimination bracket. Players register while it is
// "registering"; it starts when it is full (or earlier, by its creator, with
// at least 3 players). Every pairing is played as a normal online match that
// the server creates for the two players. The winner moves on to the next
// round; a draw is replayed.

export const TOURNAMENT_STATUSES = ['registering', 'running', 'finished'] as const;
export type TournamentStatus = (typeof TOURNAMENT_STATUSES)[number];

export const TOURNAMENT_SIZES = [4, 8] as const;
export type TournamentSize = (typeof TOURNAMENT_SIZES)[number];

export const MIN_TOURNAMENT_PLAYERS = 3;

export interface PlayerRef {
  id: string;
  displayName: string;
}

export interface TournamentSummary {
  id: string;
  name: string;
  status: TournamentStatus;
  size: TournamentSize;
  playerCount: number;
  settings: MatchSettings;
  createdBy: PlayerRef;
  createdAt: string;
  winner: PlayerRef | null;
  /** The viewer is registered. */
  joined: boolean;
}

export interface Pairing {
  id: string;
  /** null while that place waits for the winner of an earlier pairing, or stays empty (bye). */
  players: [UserSummary | null, UserSummary | null];
  /** The match of this pairing, once both players are known. */
  matchId: string | null;
  winnerId: string | null;
  /** One player had no opponent and went through without playing. */
  bye: boolean;
}

export interface Round {
  pairings: Pairing[];
}

export interface Tournament extends TournamentSummary {
  /** Registered players, in order of registration. */
  players: UserSummary[];
  /** Empty until the tournament starts. Round 0 is the first round. */
  rounds: Round[];
  startedAt: string | null;
  endedAt: string | null;
}

export interface CreateTournamentInput {
  name: string;
  size: TournamentSize;
  settings?: MatchSettings;
}

export interface ListTournamentsParams {
  status?: TournamentStatus;
  limit?: number;
  offset?: number;
}
