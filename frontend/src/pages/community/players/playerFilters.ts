import { PLAYER_SORTS, type PlayerSort } from '@/features/users/types';
import { readPage } from '@/lib/pages';

// The player search keeps its filters in the URL (?q=li&online=1&sort=wins&page=2),
// so a search can be reloaded, shared and used with the Back button.

export interface PlayerFilters {
  search: string;
  online: boolean;
  friends: boolean;
  sort: PlayerSort;
  page: number;
}

export const DEFAULT_SORT: PlayerSort = 'name';

const isSort = (value: string | null): value is PlayerSort => PLAYER_SORTS.includes(value as PlayerSort);

/** The filters written in the URL; anything missing or invalid falls back to its default. */
export function readFilters(params: URLSearchParams): PlayerFilters {
  const sort = params.get('sort');
  return {
    search: params.get('q') ?? '',
    online: params.get('online') === '1',
    friends: params.get('friends') === '1',
    sort: isSort(sort) ? sort : DEFAULT_SORT,
    page: readPage(params),
  };
}

/** The URL for these filters. Defaults are left out so the address stays short. */
export function writeFilters(filters: PlayerFilters): URLSearchParams {
  const query = new URLSearchParams();
  if (filters.search) query.set('q', filters.search);
  if (filters.online) query.set('online', '1');
  if (filters.friends) query.set('friends', '1');
  if (filters.sort !== DEFAULT_SORT) query.set('sort', filters.sort);
  if (filters.page > 1) query.set('page', String(filters.page));
  return query;
}
