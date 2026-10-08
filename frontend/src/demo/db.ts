import type { Difficulty } from '@/features/game/bot';
import type { MatchEndReason, MatchSettings, MatchStatus, PlayerResult } from '@/features/matches/types';
import type { MessageKind, SystemEvent } from '@/features/chat/types';
import type { TournamentSize, TournamentStatus } from '@/features/tournaments/types';
import type { Bracket } from '@/features/tournaments/bracket';
import type { ProfileStats } from '@/features/users/types';
import { readStorage, removeStorage, writeStorage } from '@/lib/storage';

// The demo server's whole world, kept in localStorage so it survives a
// reload. Everything here is made up, except the logged-in user ("the
// viewer"), who comes from the real backend.

export interface DemoPlayer {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
  online: boolean;
  lastSeenAt: string | null;
  stats: ProfileStats;
  /** How well this player's computer brain plays. */
  level: Difficulty;
}

export interface DemoMessage {
  id: string;
  peerId: string;
  /** viewer: written by the viewer; peer: by the other player; system: by the server. */
  from: 'viewer' | 'peer' | 'system';
  kind: MessageKind;
  body: string;
  matchId: string | null;
  tournamentId: string | null;
  event: SystemEvent | null;
  createdAt: string;
}

/** What one logged-in user has in the demo world. */
export interface ViewerState {
  /** First visit of the demo (stands in for the sign-up date). */
  joinedAt: string;
  friends: { id: string; since: string }[];
  /** Players who sent the viewer a friend request. */
  incoming: string[];
  /** Players the viewer sent a request to. */
  outgoing: string[];
  blocked: string[];
  messages: DemoMessage[];
  /** Per player: the viewer read their messages up to this time. */
  readByViewer: Record<string, string>;
  /** Per player: they read the viewer's messages up to this time. */
  readByPeer: Record<string, string>;
  /** Profile changes made in the demo (the real account is not touched). */
  profile: { displayName?: string; avatarUrl?: string | null };
}

export interface DemoMatchPlayer {
  seat: 1 | 2;
  userId: string;
  displayName: string;
  result: PlayerResult | null;
}

export interface DemoMatch {
  id: string;
  status: MatchStatus;
  endReason: MatchEndReason | null;
  settings: MatchSettings;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  players: DemoMatchPlayer[];
  moves: number[];
  /** Waiting matches: the only player allowed to join. */
  invitedId: string | null;
  /** When the computer-controlled player to move will play (ms since 1970). */
  nextMoveAt: number | null;
  /** Thinking time per move, in ms. */
  moveDelay: number;
  tournamentId: string | null;
}

export interface DemoTournament {
  id: string;
  name: string;
  status: TournamentStatus;
  size: TournamentSize;
  settings: MatchSettings;
  createdBy: string;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  /** Player ids in order of registration. */
  players: string[];
  /** Player ids; empty until the start. */
  bracket: Bracket<string>;
  /** Per pairing ("round:index"): its pairing id and current match. */
  pairings: Record<string, { id: string; matchId: string | null }>;
}

/** Something that happens a little later, like a reply to a message. */
export type DemoTask =
  | { at: number; type: 'reply'; viewerId: string; peerId: string; invite: boolean }
  | { at: number; type: 'read'; viewerId: string; peerId: string }
  | { at: number; type: 'typing'; viewerId: string; peerId: string }
  | { at: number; type: 'accept-friend'; viewerId: string; peerId: string }
  | { at: number; type: 'join-match'; matchId: string }
  | { at: number; type: 'join-tournament'; tournamentId: string };

export interface DemoDb {
  version: number;
  players: DemoPlayer[];
  viewers: Record<string, ViewerState>;
  matches: DemoMatch[];
  tournaments: DemoTournament[];
  tasks: DemoTask[];
}

const STORAGE_KEY = 'demo-data';
/** Bump when the shape changes: older saved data is then thrown away. */
export const DB_VERSION = 1;

export function loadDb(): DemoDb | null {
  const raw = readStorage(STORAGE_KEY);
  if (!raw) return null;
  try {
    const db = JSON.parse(raw) as DemoDb;
    return db.version === DB_VERSION ? db : null;
  } catch {
    return null;
  }
}

export function saveDb(db: DemoDb): void {
  writeStorage(STORAGE_KEY, JSON.stringify(db));
}

export function clearDb(): void {
  removeStorage(STORAGE_KEY);
}

export const newId = (): string => crypto.randomUUID();

export const isoNow = (): string => new Date().toISOString();

export function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}
