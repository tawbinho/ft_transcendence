import type { TournamentStatus } from './tournament.constants.js';

// WHY THIS FILE EXISTS
// Turns database rows into the JSON the API sends. It is a PURE function (no
// database, no Nest), so it is easy to test. The shapes below are the ones in
// the API design (backend/docs/openapi.yaml: Tournament, TournamentSummary).
//
// The inputs are plain shapes rather than the entity classes, so a test can
// build them by hand.

export interface TournamentData {
  id: string;
  name: string;
  status: TournamentStatus;
  size: number;
  cols: number;
  rows: number;
  winLength: number;
  theme: string;
  createdAt: Date;
  startedAt: Date | null;
  endedAt: Date | null;
  createdBy: { id: string; displayName: string };
  winner: { id: string; displayName: string } | null;
}

// A registered player, as loaded from the database.
export interface RegisteredPlayer {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
}

// ---- What the API returns -------------------------------------------------

export interface PlayerRefView {
  id: string;
  displayName: string;
}

// A player as the app shows them: name, picture, online dot.
export interface PlayerView {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  online: boolean;
}

export interface PairingView {
  id: string;
  // Two places. null: waiting for the winner of an earlier pairing, or empty (bye).
  players: [PlayerView | null, PlayerView | null];
  matchId: string | null;
  winnerId: string | null;
  bye: boolean;
}

export interface RoundView {
  pairings: PairingView[];
}

export interface TournamentSummaryView {
  id: string;
  name: string;
  status: TournamentStatus;
  size: number;
  playerCount: number;
  settings: { cols: number; rows: number; winLength: number; theme: string };
  createdBy: PlayerRefView;
  createdAt: Date;
  winner: PlayerRefView | null;
  // The viewer is registered.
  joined: boolean;
}

export interface TournamentView extends TournamentSummaryView {
  players: PlayerView[]; // in order of registration
  rounds: RoundView[]; // empty until the tournament starts
  startedAt: Date | null;
  endedAt: Date | null;
}

// ---- Mapping ----------------------------------------------------------------

export function toTournamentSummary(
  data: TournamentData,
  playerCount: number,
  joined: boolean,
): TournamentSummaryView {
  return {
    id: data.id,
    name: data.name,
    status: data.status,
    size: data.size,
    playerCount,
    settings: {
      cols: data.cols,
      rows: data.rows,
      winLength: data.winLength,
      theme: data.theme,
    },
    createdBy: {
      id: data.createdBy.id,
      displayName: data.createdBy.displayName,
    },
    createdAt: data.createdAt,
    winner: data.winner
      ? { id: data.winner.id, displayName: data.winner.displayName }
      : null,
    joined,
  };
}

// `players` must already be in order of registration (the service sorts them).
export function toTournament(
  data: TournamentData,
  players: RegisteredPlayer[],
  viewerId: string,
): TournamentView {
  return {
    ...toTournamentSummary(
      data,
      players.length,
      players.some((player) => player.userId === viewerId),
    ),
    players: players.map((player) => ({
      id: player.userId,
      displayName: player.displayName,
      avatarUrl: player.avatarUrl,
      // Presence (who is online) is not built yet, so nobody is reported
      // online. It will come from the users module.
      online: false,
    })),
    // The bracket is built when the tournament starts, which is not built yet.
    rounds: [],
    startedAt: data.startedAt,
    endedAt: data.endedAt,
  };
}
