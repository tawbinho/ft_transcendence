import { useTranslation } from 'react-i18next';
import { LoadError } from '@/components/LoadError';
import { EmptyState, SectionSpinner, Pagination } from '@/components/ui';
import { withoutComputerPlayers } from '@/features/users/computerPlayers';
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

  if (results.isPending) return <SectionSpinner />;
  if (results.error) {
    return <LoadError error={results.error} onRetry={() => void results.refetch()} retrying={results.isFetching} />;
  }

  // Computer opponents cannot be friends, so the search does not offer them.
  const players = withoutComputerPlayers(results.data.items);
  // The server's total still counts them. Taking away the ones hidden on this page makes the
  // count right when all players fit on one page; with more pages it can be off by a few.
  const total = results.data.total - (results.data.items.length - players.length);

  return (
    <section aria-label={t('players.results')} className="flex flex-col gap-4">
      <p role="status" className="text-sm text-muted">
        {t('players.resultCount', { count: total })}
      </p>
      {players.length === 0 ? (
        <EmptyState>{t('players.empty')}</EmptyState>
      ) : (
        <ul className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-3', results.isPlaceholderData && 'opacity-60')}>
          {players.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </ul>
      )}
      <Pagination
        page={filters.page}
        pages={pageCount(total, PAGE_SIZE)}
        label={t('players.title')}
        onChange={onPageChange}
      />
    </section>
  );
}
