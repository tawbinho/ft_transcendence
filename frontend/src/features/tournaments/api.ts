import { http } from '@/lib/api/http';
import type { Page } from '@/lib/api/types';
import type { CreateTournamentInput, ListTournamentsParams, Tournament, TournamentSummary } from './types';

const tournamentPath = (id: string) => `/tournaments/${encodeURIComponent(id)}`;

export const tournamentsApi = {
  list: (params: ListTournamentsParams, signal?: AbortSignal) =>
    http.get<Page<TournamentSummary>>('/tournaments', { query: { ...params }, signal }),

  /** Creates a tournament with the creator already registered. */
  create: (input: CreateTournamentInput) => http.post<Tournament>('/tournaments', input),

  get: (id: string, signal?: AbortSignal) => http.get<Tournament>(tournamentPath(id), { signal }),

  join: (id: string) => http.post<Tournament>(`${tournamentPath(id)}/join`),

  leave: (id: string) => http.post<Tournament>(`${tournamentPath(id)}/leave`),

  /** Creator only: starts before the tournament is full (at least 3 players). */
  start: (id: string) => http.post<Tournament>(`${tournamentPath(id)}/start`),

  /** Creator only, while registration is open. */
  remove: (id: string) => http.delete<null>(tournamentPath(id)),
};
