import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { LoadError } from '@/components/LoadError';
import { PageHeader } from '@/components/PageHeader';
import { buttonClass, EmptyState, PageSpinner, Pagination } from '@/components/ui';
import { LIVE_PAGE_SIZE, useLiveMatches } from '@/features/spectate/hooks';
import { cn } from '@/lib/cn';
import { pageCount, readPage } from '@/lib/pages';
import { useUrlParams } from '@/lib/useUrlParams';
import { LiveMatchCard } from './LiveMatchCard';

/** Matches being played right now; open one to follow it live. */
export function WatchPage() {
  const { t } = useTranslation();
  const [params, setParams] = useUrlParams();
  const page = readPage(params);
  const live = useLiveMatches(page);

  return (
    <>
      <PageHeader title={t('watch.title')} subtitle={t('watch.subtitle')} />
      {live.isPending ? (
        <PageSpinner />
      ) : live.error ? (
        <LoadError error={live.error} onRetry={() => void live.refetch()} retrying={live.isFetching} />
      ) : live.data.items.length === 0 ? (
        <EmptyState
          action={
            <Link to="/play/online" className={buttonClass({ variant: 'secondary' })}>
              {t('watch.startMatch')}
            </Link>
          }
        >
          {t('watch.empty')}
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-4">
          <ul className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', live.isPlaceholderData && 'opacity-60')}>
            {live.data.items.map((match) => (
              <li key={match.id}>
                <LiveMatchCard match={match} />
              </li>
            ))}
          </ul>
          <Pagination
            page={page}
            pages={pageCount(live.data.total, LIVE_PAGE_SIZE)}
            label={t('watch.title')}
            onChange={(next) => setParams(next > 1 ? { page: String(next) } : {})}
          />
        </div>
      )}
    </>
  );
}
