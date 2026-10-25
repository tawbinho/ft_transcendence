import type { MatchSettings } from '@/features/matches/types';
import type { UserSummary } from '@/features/users/types';

// The shapes of the tournament routes (docs/api-contract.md, "Tournaments").

export const TOURNAMENT_STATUSES = ['registering', 'running', 'finished'] as const;
export type TournamentStatus = (typeof TOURNAMENT_STATUSES)[number];

/** A tournament always has 4 places: two semi-finals and a final. */
export const TOURNAMENT_SIZES = [4] as const;
export type TournamentSize = (typeof TOURNAMENT_SIZES)[number];

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
  /** null while that place waits for the winner of a semi-final. */
  players: [UserSummary | null, UserSummary | null];
  /** The match of this pairing, once both players are known. */
  matchId: string | null;
  winnerId: string | null;
}

export interface Round {
  pairings: Pairing[];
}

export interface Tournament extends TournamentSummary {
  /** Registered players, in order of registration. */
  players: UserSummary[];
  /** Empty until the tournament starts. Round 0 is the semi-finals, round 1 the final. */
  rounds: Round[];
  startedAt: string | null;
  endedAt: string | null;
}

export interface CreateTournamentInput {
  name: string;
  settings?: MatchSettings;
}

export interface ListTournamentsParams {
  status?: TournamentStatus;
  limit?: number;
  offset?: number;
}
