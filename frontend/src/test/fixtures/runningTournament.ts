import type { Tournament } from '@/features/tournaments/types';
import { makeTournament } from './tournaments';
import { makeSummary } from './users';

// A running tournament for 4: alice (u1) and bob (u2) in one semi-final, carol (u3)
// and dave (u4) in the other, which carol already won. Alice's match is ready to play.
export const SEMI_MATCH_ID = '3c5e7a9b-1d2f-4a6c-8e0b-9f1d3b5c7e24';
export const WATCHED_MATCH_ID = '6f8a0c2e-4b6d-4e8a-a1c3-5e7a9c1b3d46';

export function makeRunningTournament(overrides: Partial<Tournament> = {}): Tournament {
  const alice = makeSummary({ id: 'u1', displayName: 'alice' });
  const bob = makeSummary({ id: 'u2', displayName: 'bob' });
  const carol = makeSummary({ id: 'u3', displayName: 'carol' });
  const dave = makeSummary({ id: 'u4', displayName: 'dave' });
  return makeTournament({
    status: 'running',
    playerCount: 4,
    players: [alice, bob, carol, dave],
    startedAt: '2026-10-08T11:00:00.000Z',
    rounds: [
      {
        pairings: [
          { id: 'p1', players: [alice, bob], matchId: SEMI_MATCH_ID, winnerId: null, bye: false },
          { id: 'p2', players: [carol, dave], matchId: WATCHED_MATCH_ID, winnerId: 'u3', bye: false },
        ],
      },
      { pairings: [{ id: 'p3', players: [null, carol], matchId: null, winnerId: null, bye: false }] },
    ],
    ...overrides,
  });
}
