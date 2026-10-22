import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { LoadError } from '@/components/LoadError';
import { PageHeader } from '@/components/PageHeader';
import { buttonClass, EmptyState, SectionSpinner, Pagination } from '@/components/ui';
import { useUser } from '@/features/auth/hooks';
import { MatchList } from '@/features/matches/components/MatchList';
import { useMatchList } from '@/features/matches/hooks';
import { cn } from '@/lib/cn';
import { pageCount } from '@/lib/pages';
import { useUrlParams } from '@/lib/useUrlParams';
import { HistoryFilters } from './HistoryFilters';
import { HistoryStats } from './HistoryStats';
import { historySearch, PAGE_SIZE, readHistoryView, toListParams, type HistoryView } from './historyQuery';

/** The member's matches: statistics on top, then the list with a filter and pages. */
export function HistoryPage() {
  const { t } = useTranslation();
  const user = useUser();

  // Filter and page live in the URL, so they survive a reload and can be shared.
  const [params, setParams] = useUrlParams();
  const view = readHistoryView(params);
  const list = useMatchList(toListParams(view));

  // Changing the filter goes back to the first page.
  const show = (next: Partial<HistoryView>) => setParams(historySearch({ filter: view.filter, page: 1, ...next }));

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
        {user && <HistoryStats displayName={user.displayName} />}
      </section>

      <section aria-labelledby="matches-title" className="flex flex-col gap-4">
        <h2 id="matches-title" className="sr-only">
          {t('history.tableCaption')}
        </h2>
        <HistoryFilters value={view.filter} onChange={(filter) => show({ filter })} />

        {list.isPending ? (
          <SectionSpinner />
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
            page={view.page}
            pages={pageCount(list.data.total, PAGE_SIZE)}
            label={t('history.tableCaption')}
            onChange={(page) => show({ page })}
          />
        )}
      </section>
    </>
  );
}
