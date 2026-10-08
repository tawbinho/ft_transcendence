import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { authKeys } from '@/features/auth/hooks';
import type { User } from '@/features/auth/types';
import { usersApi } from './api';
import { shrinkAvatar } from './avatar';
import type { PlayerSearchParams, UpdateProfileInput } from './types';

export const userKeys = {
  all: ['users'] as const,
  search: (params: PlayerSearchParams) => [...userKeys.all, 'search', params] as const,
  profile: (displayName: string) => [...userKeys.all, 'profile', displayName] as const,
  matches: (displayName: string, page: number) => [...userKeys.all, 'matches', displayName, page] as const,
};

export function usePlayerSearch(params: PlayerSearchParams) {
  return useQuery({
    queryKey: userKeys.search(params),
    queryFn: ({ signal }) => usersApi.search(params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useProfile(displayName: string) {
  return useQuery({
    queryKey: userKeys.profile(displayName),
    queryFn: ({ signal }) => usersApi.get(displayName, signal),
  });
}

export const PROFILE_MATCHES_PAGE = 10;

export function useProfileMatches(displayName: string, page: number) {
  return useQuery({
    queryKey: userKeys.matches(displayName, page),
    queryFn: ({ signal }) =>
      usersApi.matches(displayName, { limit: PROFILE_MATCHES_PAGE, offset: (page - 1) * PROFILE_MATCHES_PAGE }, signal),
    placeholderData: keepPreviousData,
  });
}

/** The account changed: show it everywhere (header, profiles, lists). */
function accountChanged(queryClient: QueryClient, user: User) {
  queryClient.setQueryData(authKeys.me, user);
  void queryClient.invalidateQueries({ queryKey: userKeys.all });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => usersApi.updateMe(input),
    onSuccess: (user) => accountChanged(queryClient, user),
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => usersApi.uploadAvatar(await shrinkAvatar(file)),
    onSuccess: (user) => accountChanged(queryClient, user),
  });
}

export function useRemoveAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.removeAvatar,
    onSuccess: (user) => accountChanged(queryClient, user),
  });
}
