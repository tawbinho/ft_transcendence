import type { MatchPage } from '@/features/matches/types';
import { http } from '@/lib/api/http';

export const spectateApi = {
  /**
   * Matches being played right now, most recent first. Watching one uses the
   * normal match route (GET /matches/:id), which answers spectators too.
   */
  live: (params: { limit?: number; offset?: number }, signal?: AbortSignal) =>
    http.get<MatchPage>('/matches/live', { query: { ...params }, signal }),
};
