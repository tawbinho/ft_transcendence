import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useLiveInterval } from '@/lib/realtime';
import { tournamentsApi } from './api';
import type { CreateTournamentInput, ListTournamentsParams, Tournament } from './types';

export const tournamentKeys = {
  all: ['tournaments'] as const,
  lists: () => [...tournamentKeys.all, 'list'] as const,
  list: (params: ListTournamentsParams) => [...tournamentKeys.lists(), params] as const,
  detail: (id: string) => [...tournamentKeys.all, 'detail', id] as const,
};

export function useTournaments(params: ListTournamentsParams) {
  return useQuery({
    queryKey: tournamentKeys.list(params),
    queryFn: ({ signal }) => tournamentsApi.list(params, signal),
    placeholderData: keepPreviousData,
    refetchInterval: useLiveInterval(10_000),
  });
}

/** One tournament, refreshed until it is over. */
export function useTournament(id: string) {
  const interval = useLiveInterval(3_000);
  return useQuery({
    queryKey: tournamentKeys.detail(id),
    queryFn: ({ signal }) => tournamentsApi.get(id, signal),
    refetchInterval: (query) => (query.state.data?.status === 'finished' ? false : interval),
  });
}

function saved(queryClient: QueryClient, tournament: Tournament) {
  queryClient.setQueryData(tournamentKeys.detail(tournament.id), tournament);
  void queryClient.invalidateQueries({ queryKey: tournamentKeys.lists() });
}

export function useCreateTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTournamentInput) => tournamentsApi.create(input),
    onSuccess: (tournament) => saved(queryClient, tournament),
  });
}

/** join, leave and start all answer the updated tournament. */
export function useTournamentAction(id: string, action: 'join' | 'leave' | 'start') {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => tournamentsApi[action](id),
    onSuccess: (tournament) => saved(queryClient, tournament),
  });
}

/**
 * Cancels a tournament, then leaves its page BEFORE forgetting it, so the
 * page never asks the server for a tournament that no longer exists.
 */
export function useDeleteTournament(id: string) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: () => tournamentsApi.remove(id),
    onSuccess: async () => {
      await navigate('/tournaments', { replace: true });
      queryClient.removeQueries({ queryKey: tournamentKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: tournamentKeys.lists() });
    },
  });
}
