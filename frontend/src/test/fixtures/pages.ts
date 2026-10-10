import type { Page } from '@/lib/api/types';

/** The answer of a list route that has nothing to list. */
export function emptyPage<T>(): Page<T> {
  return { items: [], total: 0, limit: 10, offset: 0 };
}

/** The answer of a list route that has these items on its only page. */
export function pageOf<T>(items: T[]): Page<T> {
  return { items, total: items.length, limit: 10, offset: 0 };
}
