import type { Bracket } from './bracket';
import {
  MIN_TOURNAMENT_PLAYERS,
  TOURNAMENT_STATUSES,
  type Pairing,
  type Tournament,
  type TournamentStatus,
  type TournamentSummary,
} from './types';

// Small decisions the tournament pages make, kept out of the components so
// they can be tested without drawing anything.

// ---- Rounds -------------------------------------------------------------------

/** Which heading a round gets; the page looks the words up as `tournaments.<name>`. */
export type RoundName = 'final' | 'semiFinals' | 'quarterFinals' | 'round';

/** The last round is the final, the one before it the semi-finals, then the quarter-finals. */
export function roundName(round: number, rounds: number): RoundName {
  const fromEnd = rounds - 1 - round;
  if (fromEnd === 0) return 'final';
  if (fromEnd === 1) return 'semiFinals';
  if (fromEnd === 2) return 'quarterFinals';
  return 'round';
}

/** A pairing of a bracket, found by its round and its place in that round. */
export interface PairingRef {
  round: number;
  index: number;
}

/** How many matches a bracket has and how many are played. A bye is not a match. */
export function countMatches(bracket: Bracket<unknown>): { played: number; total: number } {
  const matches = bracket.flat().filter((pairing) => !pairing.bye);
  return { played: matches.filter((pairing) => pairing.winner !== null).length, total: matches.length };
}

// ---- Online tournament buttons --------------------------------------------------

/** A member can join while registration is open and they are not in yet. */
export function canJoin(tournament: TournamentSummary): boolean {
  return tournament.status === 'registering' && !tournament.joined && tournament.playerCount < tournament.size;
}

/** The creator cannot leave their own tournament: they cancel it instead. */
export function canLeave(tournament: TournamentSummary, viewerId: string | undefined): boolean {
  return tournament.status === 'registering' && tournament.joined && tournament.createdBy.id !== viewerId;
}

/** Only the creator starts it early, and only with enough players. */
export function canStart(tournament: TournamentSummary, viewerId: string | undefined): boolean {
  return (
    tournament.status === 'registering' &&
    tournament.createdBy.id === viewerId &&
    tournament.playerCount >= MIN_TOURNAMENT_PLAYERS
  );
}

/** Only the creator cancels, and only while registration is open. */
export function canCancel(tournament: TournamentSummary, viewerId: string | undefined): boolean {
  return tournament.status === 'registering' && tournament.createdBy.id === viewerId;
}

/** The pairing the viewer has to play now (its match exists and has no winner), if any. */
export function pairingToPlay(tournament: Tournament, viewerId: string | undefined): Pairing | null {
  if (!viewerId || tournament.status !== 'running') return null;
  for (const round of tournament.rounds) {
    for (const pairing of round.pairings) {
      const plays = pairing.players.some((player) => player?.id === viewerId);
      if (plays && pairing.matchId && !pairing.winnerId) return pairing;
    }
  }
  return null;
}

// ---- The list of online tournaments ---------------------------------------------

export const TOURNAMENT_FILTERS = ['all', ...TOURNAMENT_STATUSES] as const;
export type TournamentFilter = (typeof TOURNAMENT_FILTERS)[number];

/** The filter named in the address (`?status=running`); anything else means "all". */
export function parseFilter(value: string | null): TournamentFilter {
  return TOURNAMENT_FILTERS.includes(value as TournamentFilter) ? (value as TournamentFilter) : 'all';
}

/** The status to ask the server for; `undefined` asks for every tournament. */
export function filterStatus(filter: TournamentFilter): TournamentStatus | undefined {
  return filter === 'all' ? undefined : filter;
}
