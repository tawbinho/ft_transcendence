import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useLiveInterval } from '@/lib/realtime';
import { spectateApi } from './api';

export const spectateKeys = {
  all: ['spectate'] as const,
  live: (page: number) => [...spectateKeys.all, 'live', page] as const,
};

export const LIVE_PAGE_SIZE = 12;

export function useLiveMatches(page: number) {
  return useQuery({
    queryKey: spectateKeys.live(page),
    queryFn: ({ signal }) => spectateApi.live({ limit: LIVE_PAGE_SIZE, offset: (page - 1) * LIVE_PAGE_SIZE }, signal),
    placeholderData: keepPreviousData,
    refetchInterval: useLiveInterval(5_000),
  });
}
