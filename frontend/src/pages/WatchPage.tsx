import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { EyeIcon } from '@/components/icons';
import { LoadError } from '@/components/LoadError';
import { PageHeader } from '@/components/PageHeader';
import { Badge, buttonClass, EmptyState, PageSpinner, Pagination } from '@/components/ui';
import { DiscIcon } from '@/features/game/components/DiscIcon';
import { toBoardTheme } from '@/features/game/settings';
import type { MatchSummary } from '@/features/matches/types';
import { LIVE_PAGE_SIZE, useLiveMatches } from '@/features/spectate/hooks';
import { cn } from '@/lib/cn';
import { pageCount, readPage } from '@/lib/pages';
import { useUrlParams } from '@/lib/useUrlParams';

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
              {t('history.emptyAction')}
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

function LiveMatchCard({ match }: { match: MatchSummary }) {
  const { t } = useTranslation();
  const theme = toBoardTheme(match.settings.theme);
  const playing = match.yourSeat !== null;
  const names = match.players.map((player) => player.displayName).join(` ${t('online.vs')} `);

  return (
    <article className="flex h-full flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <Badge tone="danger">
          <span
            className="me-1.5 inline-block size-2 rounded-full bg-current motion-safe:animate-pulse"
            aria-hidden="true"
          />
          {t('watch.live')}
        </Badge>
        <span className="text-sm text-muted">
          {t('game.moves')}: <span className="font-semibold tabular-nums text-fg">{match.moveCount}</span>
        </span>
      </div>
      <h2 className="sr-only">{names}</h2>
      <ul className="flex flex-col gap-2" aria-hidden="true">
        {match.players.map((player) => (
          <li key={player.seat} className="flex min-w-0 items-center gap-2 font-semibold">
            <DiscIcon seat={player.seat} theme={theme} className="text-xl" />
            <span className="truncate">{player.displayName}</span>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted">
        {t('game.size', { cols: match.settings.cols, rows: match.settings.rows })} ·{' '}
        {t('game.connect', { n: match.settings.winLength })}
      </p>
      <Link
        to={playing ? paths.match(match.id) : paths.watch(match.id)}
        className={buttonClass({ variant: playing ? 'primary' : 'secondary', className: 'mt-auto' })}
        aria-label={playing ? t('watch.yourMatch') : t('watch.watchMatch', { names })}
      >
        <EyeIcon />
        {playing ? t('watch.yourMatch') : t('watch.watch')}
      </Link>
    </article>
  );
}
