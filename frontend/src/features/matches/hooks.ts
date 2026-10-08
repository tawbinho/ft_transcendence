import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { LIVE_POLL_MS, useRealtimeStatus, watchMatch } from '@/lib/realtime';
import { matchesApi } from './api';
import { pollInterval, withMove } from './model';
import type { CreateMatchInput, ListMatchesParams, Match, MatchSummary } from './types';

export const matchKeys = {
  all: ['matches'] as const,
  lists: () => [...matchKeys.all, 'list'] as const,
  list: (params: ListMatchesParams) => [...matchKeys.lists(), params] as const,
  finished: () => [...matchKeys.all, 'finished'] as const,
  detail: (id: string) => [...matchKeys.all, 'detail', id] as const,
  move: (id: string) => [...matchKeys.all, 'move', id] as const,
};

/** Lists and statistics are stale as soon as any match changes. */
function refreshLists(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: matchKeys.lists() });
  void queryClient.invalidateQueries({ queryKey: matchKeys.finished() });
}

/**
 * One match, for its players and spectators alike. It is polled while it can
 * still change (slowly when live events arrive, see src/app/realtime.ts).
 * Polling pauses while the viewer's own move is being sent, so an older
 * answer cannot hide the disc they just dropped.
 */
export function useMatch(id: string, { paused = false }: { paused?: boolean } = {}) {
  const live = useRealtimeStatus() === 'live';
  useEffect(() => watchMatch(id), [id]);
  return useQuery({
    queryKey: matchKeys.detail(id),
    queryFn: ({ signal }) => matchesApi.get(id, signal),
    refetchInterval: (query) => {
      const interval = paused ? false : pollInterval(query.state.data);
      return interval !== false && live ? Math.max(interval, LIVE_POLL_MS) : interval;
    },
    refetchOnWindowFocus: !paused,
  });
}

export function useMatchList(params: ListMatchesParams) {
  return useQuery({
    queryKey: matchKeys.list(params),
    queryFn: ({ signal }) => matchesApi.listMine(params, signal),
    placeholderData: keepPreviousData,
  });
}

const STATS_PAGE_SIZE = 50;
const STATS_MAX_PAGES = 6;

/**
 * Finished matches for the statistics, newest first. The backend has no
 * statistics route yet, so they are computed from the history: up to
 * 300 matches, which `complete` says whether it covers.
 */
export function useFinishedMatches() {
  return useQuery({
    queryKey: matchKeys.finished(),
    queryFn: async ({ signal }) => {
      const items: MatchSummary[] = [];
      let total = 0;
      for (let page = 0; page < STATS_MAX_PAGES; page++) {
        const result = await matchesApi.listMine(
          { status: 'finished', limit: STATS_PAGE_SIZE, offset: page * STATS_PAGE_SIZE },
          signal,
        );
        items.push(...result.items);
        total = result.total;
        if (items.length >= total || result.items.length === 0) break;
      }
      return { items, total, complete: items.length >= total };
    },
  });
}

export function useCreateMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMatchInput) => matchesApi.create(input),
    onSuccess: (match) => {
      queryClient.setQueryData(matchKeys.detail(match.id), match);
      refreshLists(queryClient);
    },
  });
}

export function useJoinMatch(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => matchesApi.join(id),
    onSuccess: (match) => {
      queryClient.setQueryData(matchKeys.detail(id), match);
      refreshLists(queryClient);
    },
  });
}

/** Plays a move with an optimistic update, rolled back if the server refuses. */
export function useMakeMove(id: string) {
  const queryClient = useQueryClient();
  const key = matchKeys.detail(id);
  return useMutation({
    mutationKey: matchKeys.move(id),
    mutationFn: (col: number) => matchesApi.move(id, col),
    onMutate: async (col) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Match>(key);
      const optimistic = previous ? withMove(previous, col) : null;
      if (optimistic) queryClient.setQueryData(key, optimistic);
      return { previous };
    },
    onError: (_error, _col, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      // The local view was wrong (opponent moved, match ended): fetch the truth.
      void queryClient.invalidateQueries({ queryKey: key });
    },
    onSuccess: (match) => {
      queryClient.setQueryData(key, match);
      if (match.status !== 'in_progress') refreshLists(queryClient);
    },
  });
}

export function useResignMatch(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => matchesApi.resign(id),
    onSuccess: (match) => {
      queryClient.setQueryData(matchKeys.detail(id), match);
      refreshLists(queryClient);
    },
  });
}
