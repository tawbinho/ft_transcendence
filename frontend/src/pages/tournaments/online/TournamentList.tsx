import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { LoadError } from '@/components/LoadError';
import { buttonClass, EmptyState, PageSpinner, Pagination } from '@/components/ui';
import { useTournaments } from '@/features/tournaments/hooks';
import { filterStatus, parseFilter, type TournamentFilter } from '@/features/tournaments/view';
import { cn } from '@/lib/cn';
import { pageCount, readPage } from '@/lib/pages';
import { useUrlParams } from '@/lib/useUrlParams';
import { TournamentFilters } from './TournamentFilters';
import { TournamentRow } from './TournamentRow';

const PAGE_SIZE = 10;

/** Online tournaments, filtered by status, with pages; both are kept in the address. */
export function TournamentList() {
  const { t } = useTranslation();
  const [params, setParams] = useUrlParams();
  const filter = parseFilter(params.get('status'));
  const page = readPage(params);
  const list = useTournaments({
    status: filterStatus(filter),
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  function go(next: { filter?: TournamentFilter; page?: number }) {
    const search = new URLSearchParams();
    const nextFilter = next.filter ?? filter;
    if (nextFilter !== 'all') search.set('status', nextFilter);
    if ((next.page ?? 1) > 1) search.set('page', String(next.page));
    setParams(search);
  }

  return (
    <section aria-labelledby="online-tournaments" className="flex flex-col gap-4">
      <h2 id="online-tournaments" className="text-xl font-bold">
        {t('tournaments.listTitle')}
      </h2>
      <TournamentFilters value={filter} onChange={(next) => go({ filter: next })} />
      {list.isPending ? (
        <PageSpinner />
      ) : list.error ? (
        <LoadError error={list.error} onRetry={() => void list.refetch()} retrying={list.isFetching} />
      ) : list.data.items.length === 0 ? (
        <EmptyState
          action={
            <Link to="/tournaments/new" className={buttonClass({ variant: 'secondary' })}>
              {t('tournaments.create')}
            </Link>
          }
        >
          {t('tournaments.empty')}
        </EmptyState>
      ) : (
        <ul
          className={cn(
            'divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface',
            list.isPlaceholderData && 'opacity-60',
          )}
        >
          {list.data.items.map((tournament) => (
            <li key={tournament.id}>
              <TournamentRow tournament={tournament} />
            </li>
          ))}
        </ul>
      )}
      {list.data && (
        <Pagination
          page={page}
          pages={pageCount(list.data.total, PAGE_SIZE)}
          label={t('tournaments.listTitle')}
          onChange={(next) => go({ page: next })}
        />
      )}
    </section>
  );
}
