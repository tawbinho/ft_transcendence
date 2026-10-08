import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { userKeys } from '@/features/users/hooks';
import { useLiveInterval } from '@/lib/realtime';
import { friendsApi } from './api';

export const friendKeys = {
  all: ['friends'] as const,
};

/** Friends and requests; refreshed regularly so online dots stay true. */
export function useFriends() {
  return useQuery({
    queryKey: friendKeys.all,
    queryFn: ({ signal }) => friendsApi.overview(signal),
    refetchInterval: useLiveInterval(20_000),
  });
}

/** Friend requests waiting for an answer, for the badge in the menu. */
export function useIncomingRequestCount(enabled: boolean): number {
  const { data } = useQuery({
    queryKey: friendKeys.all,
    queryFn: ({ signal }) => friendsApi.overview(signal),
    enabled,
    refetchInterval: useLiveInterval(30_000),
    select: (overview) => overview.incoming.length,
  });
  return data ?? 0;
}

/** Friendship shows on profiles and in the player search too. */
export function refreshFriendships(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: friendKeys.all });
  void queryClient.invalidateQueries({ queryKey: userKeys.all });
}

export function useAddFriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => friendsApi.add(userId),
    onSuccess: () => refreshFriendships(queryClient),
  });
}

export function useRemoveFriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => friendsApi.remove(userId),
    onSuccess: () => refreshFriendships(queryClient),
  });
}
