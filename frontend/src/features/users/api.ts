import type { User } from '@/features/auth/types';
import { http } from '@/lib/api/http';
import type { Page } from '@/lib/api/types';
import type { PlayerListItem, PlayerSearchParams, Profile, ProfileMatch, UpdateProfileInput } from './types';

const userPath = (displayName: string) => `/users/${encodeURIComponent(displayName)}`;

export const usersApi = {
  search: (params: PlayerSearchParams, signal?: AbortSignal) =>
    http.get<Page<PlayerListItem>>('/users', { query: { ...params }, signal }),

  /** A player's profile; display names are matched exactly (case-sensitive). */
  get: (displayName: string, signal?: AbortSignal) => http.get<Profile>(userPath(displayName), { signal }),

  /** A player's finished matches, newest first. */
  matches: (displayName: string, params: { limit?: number; offset?: number }, signal?: AbortSignal) =>
    http.get<Page<ProfileMatch>>(`${userPath(displayName)}/matches`, { query: { ...params }, signal }),

  updateMe: (input: UpdateProfileInput) => http.patch<User>('/users/me', input),

  /** The picture goes in the multipart field "avatar". */
  uploadAvatar: (picture: Blob) => {
    const form = new FormData();
    form.set('avatar', picture, 'avatar');
    return http.put<User>('/users/me/avatar', form);
  },

  /** Back to the default avatar. */
  removeAvatar: () => http.delete<User>('/users/me/avatar'),
};
