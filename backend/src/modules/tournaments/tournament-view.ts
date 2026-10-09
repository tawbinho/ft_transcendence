import { isOnline } from '../users/presence.service.js';
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
  lastSeenAt: Date | null; // decides the online dot
}

// One pairing of the bracket, as loaded from the database.
export interface PairingData {
  id: string;
  round: number;
  position: number;
  player1Id: string | null;
  player2Id: string | null;
  matchId: string | null;
  winnerId: string | null;
  bye: boolean;
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
  pairings: PairingData[] = [],
  now = Date.now(),
): TournamentView {
  const views = new Map<string, PlayerView>(
    players.map((player) => [
      player.userId,
      {
        id: player.userId,
        displayName: player.displayName,
        avatarUrl: player.avatarUrl,
        online: isOnline(player.lastSeenAt, now),
      },
    ]),
  );
  const view = (id: string | null): PlayerView | null =>
    id ? (views.get(id) ?? null) : null;

  return {
    ...toTournamentSummary(
      data,
      players.length,
      players.some((player) => player.userId === viewerId),
    ),
    players: players.map((player) => views.get(player.userId)!),
    rounds: toRounds(pairings, view),
    startedAt: data.startedAt,
    endedAt: data.endedAt,
  };
}

// Groups the pairings into rounds (round 0 first), each in order of position.
// Empty until the tournament starts.
function toRounds(
  pairings: PairingData[],
  view: (id: string | null) => PlayerView | null,
): RoundView[] {
  const rounds: RoundView[] = [];
  const ordered = [...pairings].sort(
    (a, b) => a.round - b.round || a.position - b.position,
  );
  for (const pairing of ordered) {
    (rounds[pairing.round] ??= { pairings: [] }).pairings.push({
      id: pairing.id,
      players: [view(pairing.player1Id), view(pairing.player2Id)],
      matchId: pairing.matchId,
      winnerId: pairing.winnerId,
      bye: pairing.bye,
    });
  }
  return rounds;
}
