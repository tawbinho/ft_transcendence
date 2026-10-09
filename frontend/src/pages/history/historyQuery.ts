import type { ListMatchesParams, MatchStatus } from '@/features/matches/types';
import { readPage } from '@/lib/pages';

// The history page keeps its filter and page in the address (?status=finished&page=2),
// so a reload or a shared link shows the same list. These functions turn the address
// into the page's state and back.

export const PAGE_SIZE = 10;

export const FILTERS = ['all', 'in_progress', 'waiting', 'finished', 'abandoned'] as const;
export type HistoryFilter = (typeof FILTERS)[number];

export interface HistoryView {
  filter: HistoryFilter;
  page: number;
}

export const isFilter = (value: string | null): value is HistoryFilter => FILTERS.includes(value as HistoryFilter);

/** The filter and page in the address; a missing or unknown value falls back to "all" and page 1. */
export function readHistoryView(params: URLSearchParams): HistoryView {
  const status = params.get('status');
  return { filter: isFilter(status) ? status : 'all', page: readPage(params) };
}

/** The address parameters for a view. Defaults are left out to keep the address short. */
export function historySearch({ filter, page }: HistoryView): URLSearchParams {
  const search = new URLSearchParams();
  if (filter !== 'all') search.set('status', filter);
  if (page > 1) search.set('page', String(page));
  return search;
}

/** What to ask the backend for. */
export function toListParams({ filter, page }: HistoryView): ListMatchesParams {
  return {
    status: filter === 'all' ? undefined : (filter as MatchStatus),
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  };
}
