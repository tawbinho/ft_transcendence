import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { PageHeader } from '@/components/PageHeader';
import { LoadError } from '@/components/LoadError';
import { buttonClass, EmptyState, OptionGroup, PageSpinner, Pagination } from '@/components/ui';
import { MatchList } from '@/features/matches/components/MatchList';
import { StatsPanel } from '@/features/matches/components/StatsPanel';
import { useMatchList } from '@/features/matches/hooks';
import type { MatchStatus } from '@/features/matches/types';
import { cn } from '@/lib/cn';
import { pageCount, readPage } from '@/lib/pages';
import { useUrlParams } from '@/lib/useUrlParams';

const PAGE_SIZE = 10;
const FILTERS = ['all', 'in_progress', 'waiting', 'finished', 'abandoned'] as const;
type Filter = (typeof FILTERS)[number];

const isFilter = (value: string | null): value is Filter => FILTERS.includes(value as Filter);

export function HistoryPage() {
  const { t } = useTranslation();

  // Filter and page live in the URL, so they survive a reload and can be shared.
  const [params, setParams] = useUrlParams();
  const statusParam = params.get('status');
  const filter: Filter = isFilter(statusParam) ? statusParam : 'all';
  const page = readPage(params);

  const list = useMatchList({
    status: filter === 'all' ? undefined : (filter as MatchStatus),
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const go = (next: { filter?: Filter; page?: number }) => {
    const nextFilter = next.filter ?? filter;
    const nextPage = next.page ?? 1;
    const search = new URLSearchParams();
    if (nextFilter !== 'all') search.set('status', nextFilter);
    if (nextPage > 1) search.set('page', String(nextPage));
    setParams(search);
  };

  return (
    <>
      <PageHeader
        title={t('history.title')}
        actions={
          <Link to="/play/online" className={buttonClass()}>
            {t('online.newMatch')}
          </Link>
        }
      />

      <section aria-labelledby="stats-title" className="mb-10 flex flex-col gap-4">
        <h2 id="stats-title" className="text-xl font-bold">
          {t('history.statsTitle')}
        </h2>
        <StatsPanel />
      </section>

      <section aria-labelledby="matches-title" className="flex flex-col gap-4">
        <h2 id="matches-title" className="sr-only">
          {t('history.tableCaption')}
        </h2>
        <OptionGroup
          legend={t('history.filterLabel')}
          value={filter}
          onChange={(value) => go({ filter: value })}
          options={FILTERS.map((value) => ({ value, label: t(`history.filters.${value}`) }))}
        />

        {list.isPending ? (
          <PageSpinner />
        ) : list.error ? (
          <LoadError error={list.error} onRetry={() => void list.refetch()} retrying={list.isFetching} />
        ) : list.data.items.length === 0 ? (
          <EmptyState
            action={
              <Link to="/play/online" className={buttonClass({ variant: 'secondary' })}>
                {t('history.emptyAction')}
              </Link>
            }
          >
            {t('history.empty')}
          </EmptyState>
        ) : (
          <div className={cn('transition', list.isPlaceholderData && 'opacity-60')}>
            <MatchList matches={list.data.items} />
          </div>
        )}

        {list.data && (
          <Pagination
            page={page}
            pages={pageCount(list.data.total, PAGE_SIZE)}
            label={t('history.tableCaption')}
            onChange={(next) => go({ page: next })}
          />
        )}
      </section>
    </>
  );
}
