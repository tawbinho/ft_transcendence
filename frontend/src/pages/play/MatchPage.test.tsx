import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@/i18n';
import { matchesApi } from '@/features/matches/api';
import type { Match } from '@/features/matches/types';
import { ApiError } from '@/lib/api/errors';
import { MatchPage } from './MatchPage';

vi.mock('@/features/matches/api', () => ({ matchesApi: { get: vi.fn() } }));
// No live connection in a test: the page falls back to asking the server.
vi.mock('@/lib/realtime', () => ({
  LIVE_POLL_MS: 30_000,
  useRealtimeStatus: () => 'off',
  watchMatch: () => () => {},
}));

const get = vi.mocked(matchesApi.get);
const MATCH_ID = '0b7e6a1e-5d0c-4c56-9a38-0d4b2c8f1a11';

function renderMatchPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/matches/${MATCH_ID}`]}>
        <Routes>
          <Route path="/matches/:matchId" element={<MatchPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('MatchPage for someone who is not in the match', () => {
  afterEach(() => {
    cleanup();
    get.mockReset();
  });

  it('says "unavailable", not "Join this match?", when the server finds no match for them', async () => {
    // What the server answers for a match that does not exist, or that started or ended without them.
    get.mockRejectedValue(new ApiError('MATCH_NOT_FOUND', 'Match not found', 404));
    renderMatchPage();
    expect(await screen.findByText('Match unavailable')).toBeTruthy();
    expect(screen.queryByText('Join this match?')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Join match' })).toBeNull();
  });

  it('still offers to join a match that waits for a second player', async () => {
    get.mockResolvedValue({ id: MATCH_ID, status: 'waiting', yourSeat: null } as Match);
    renderMatchPage();
    expect(await screen.findByText('Join this match?')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Join match' })).toBeTruthy();
  });
});
