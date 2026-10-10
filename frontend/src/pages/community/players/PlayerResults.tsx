import { useTranslation } from 'react-i18next';
import { LoadError } from '@/components/LoadError';
import { EmptyState, PageSpinner, Pagination } from '@/components/ui';
import { usePlayerSearch } from '@/features/users/hooks';
import { cn } from '@/lib/cn';
import { pageCount } from '@/lib/pages';
import { PlayerCard } from './PlayerCard';
import type { PlayerFilters } from './playerFilters';

export const PAGE_SIZE = 12;

/** Asks the API for the players that match the filters and shows them as cards, with pages. */
export function PlayerResults({
  filters,
  onPageChange,
}: {
  filters: PlayerFilters;
  onPageChange: (page: number) => void;
}) {
  const { t } = useTranslation();
  const results = usePlayerSearch({
    search: filters.search || undefined,
    online: filters.online || undefined,
    friends: filters.friends || undefined,
    sort: filters.sort,
    limit: PAGE_SIZE,
    offset: (filters.page - 1) * PAGE_SIZE,
  });

  if (results.isPending) return <PageSpinner />;
  if (results.error) {
    return <LoadError error={results.error} onRetry={() => void results.refetch()} retrying={results.isFetching} />;
  }

  return (
    <section aria-label={t('players.results')} className="flex flex-col gap-4">
      <p role="status" className="text-sm text-muted">
        {t('players.resultCount', { count: results.data.total })}
      </p>
      {results.data.items.length === 0 ? (
        <EmptyState>{t('players.empty')}</EmptyState>
      ) : (
        <ul className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-3', results.isPlaceholderData && 'opacity-60')}>
          {results.data.items.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </ul>
      )}
      <Pagination
        page={filters.page}
        pages={pageCount(results.data.total, PAGE_SIZE)}
        label={t('players.title')}
        onChange={onPageChange}
      />
    </section>
  );
}
