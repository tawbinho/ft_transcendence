import type { Tournament } from '@/features/tournaments/types';
import { TOURNAMENT_ID } from './ids';
import { makeSummary } from './users';

/** A tournament for 4 that is still taking registrations, with two players in. */
export function makeTournament(overrides: Partial<Tournament> = {}): Tournament {
  const alice = makeSummary({ id: 'u1', displayName: 'alice' });
  const bob = makeSummary({ id: 'u2', displayName: 'bob' });
  return {
    id: TOURNAMENT_ID,
    name: 'Friday cup',
    status: 'registering',
    size: 4,
    playerCount: 2,
    settings: { cols: 7, rows: 6, winLength: 4, theme: 'classic' },
    createdBy: { id: alice.id, displayName: alice.displayName },
    createdAt: '2026-10-08T10:00:00.000Z',
    winner: null,
    joined: true,
    players: [alice, bob],
    rounds: [],
    startedAt: null,
    endedAt: null,
    ...overrides,
  };
}
