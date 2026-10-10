import { useTranslation } from 'react-i18next';
import { LoadError } from '@/components/LoadError';
import { StatTiles } from '@/components/StatTiles';
import { Badge, ProgressBar, Skeleton, type BadgeTone } from '@/components/ui';
import { useFinishedMatches } from '@/features/matches/hooks';
import { computeStats } from '@/features/matches/stats';
import { formatPercent } from '@/lib/format';
import { recentResults, type RecentResult } from './recentResults';

const RECENT_COUNT = 10;
const RESULT_TONE: Record<RecentResult, BadgeTone> = { won: 'success', lost: 'danger', draw: 'neutral' };

/** The player's numbers, worked out from their finished matches. */
export function HistoryStats() {
  const { t, i18n } = useTranslation();
  const finished = useFinishedMatches();

  if (finished.isPending) {
    return (
      <div role="status" className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <span className="sr-only">{t('common.loading')}</span>
        {Array.from({ length: 7 }, (_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }
  if (finished.error) {
    return (
      <LoadError error={finished.error} onRetry={() => void finished.refetch()} retrying={finished.isRefetching} />
    );
  }

  const stats = computeStats(finished.data.items);
  const recent = recentResults(finished.data.items, RECENT_COUNT);
  const tiles: [string, string][] = [
    [t('history.played'), String(stats.played)],
    [t('history.wins'), String(stats.wins)],
    [t('history.losses'), String(stats.losses)],
    [t('history.draws'), String(stats.draws)],
    [t('history.winRate'), stats.winRate === null ? t('history.none') : formatPercent(stats.winRate, i18n.language)],
    // A number like the other tiles; the label says whether the streak is of wins, losses or draws, and stays short so tiles keep one line.
    [
      stats.streak ? t(`history.streakOf.${stats.streak.outcome}`) : t('history.streak'),
      String(stats.streak?.length ?? 0),
    ],
    [t('history.bestStreak'), String(stats.bestWinStreak)],
  ];

  return (
    <div className="flex flex-col gap-3">
      <StatTiles tiles={tiles} className="lg:grid-cols-7" />
      {stats.winRate !== null && (
        <div className="flex flex-col gap-1.5">
          <p className="text-sm text-muted">{t('history.winRateBar')}</p>
          <ProgressBar value={stats.winRate * 100} label={t('history.winRateBar')} />
        </div>
      )}
      {recent.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted">
            <span className="font-semibold text-fg">{t('history.recent')}</span> · {t('history.recentHint')}
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {recent.map((result, i) => (
              <li key={i}>
                <Badge tone={RESULT_TONE[result]}>{t(`history.status.${result}`)}</Badge>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!finished.data.complete && (
        <p className="text-sm text-muted">{t('history.statsPartial', { count: finished.data.items.length })}</p>
      )}
    </div>
  );
}
