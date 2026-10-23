import { http } from '@/lib/api/http';
import type { CreateMatchInput, ListMatchesParams, Match, MatchPage } from './types';

export const matchesApi = {
  create: (input: CreateMatchInput) => http.post<Match>('/matches', input),

  /** The viewer's matches, newest first. */
  listMine: (params: ListMatchesParams = {}, signal?: AbortSignal) =>
    http.get<MatchPage>('/matches/mine', { query: { ...params }, signal }),

  /** Anyone while the match waits for its second player, then only its players; anyone else gets a 404. */
  get: (id: string, signal?: AbortSignal) => http.get<Match>(`/matches/${encodeURIComponent(id)}`, { signal }),

  join: (id: string) => http.post<Match>(`/matches/${encodeURIComponent(id)}/join`),

  move: (id: string, col: number) => http.post<Match>(`/matches/${encodeURIComponent(id)}/moves`, { col }),

  /** Concedes a running match, or cancels one still waiting for an opponent. */
  resign: (id: string) => http.post<Match>(`/matches/${encodeURIComponent(id)}/resign`),
};
