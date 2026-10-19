import { MatchSettingsResponse } from '../../matches/dto/match.responses.js';
import {
  TOURNAMENT_SIZES,
  TOURNAMENT_STATUSES,
  type TournamentSize,
  type TournamentStatus,
} from '../tournament.constants.js';

// WHY THIS FILE EXISTS
// Documentation only: these classes describe, for the Swagger page, what the
// tournament routes put inside `data`. They do not change what the API
// returns. Keep them in sync with tournament-view.ts, which builds the real
// objects.

export class PlayerRefResponse {
  id: string;

  displayName: string;
}

export class TournamentPlayerResponse extends PlayerRefResponse {
  avatarUrl: string | null;

  online: boolean;
}

export class PairingResponse {
  id: string;

  players: (TournamentPlayerResponse | null)[];

  matchId: string | null;

  winnerId: string | null;

  bye: boolean;
}

export class RoundResponse {
  pairings: PairingResponse[];
}

export class TournamentSummaryResponse {
  id: string;

  name: string;

  status: TournamentStatus;

  size: TournamentSize;

  playerCount: number;

  settings: MatchSettingsResponse;

  createdBy: PlayerRefResponse;

  createdAt: Date;

  winner: PlayerRefResponse | null;

  joined: boolean;
}

export class TournamentResponse extends TournamentSummaryResponse {
  players: TournamentPlayerResponse[];

  rounds: RoundResponse[];

  startedAt: Date | null;

  endedAt: Date | null;
}

export class TournamentPageResponse {
  items: TournamentSummaryResponse[];

  total: number;

  limit: number;

  offset: number;
}
