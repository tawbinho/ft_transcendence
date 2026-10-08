import { useTranslation } from 'react-i18next';
import { LoadError } from '@/components/LoadError';
import { StatTiles } from '@/components/StatTiles';
import { Spinner } from '@/components/ui';
import { formatPercent } from '@/lib/format';
import { useFinishedMatches } from '../hooks';
import { computeStats } from '../stats';

export function StatsPanel() {
  const { t, i18n } = useTranslation();
  const finished = useFinishedMatches();

  if (finished.isPending) {
    return (
      <div role="status" className="flex items-center gap-3 text-muted">
        <Spinner />
        {t('common.loading')}
      </div>
    );
  }
  if (finished.error) {
    return (
      <LoadError error={finished.error} onRetry={() => void finished.refetch()} retrying={finished.isRefetching} />
    );
  }

  const stats = computeStats(finished.data.items);
  const streak = stats.streak
    ? t(
        stats.streak.outcome === 'won'
          ? 'history.streakWon'
          : stats.streak.outcome === 'lost'
            ? 'history.streakLost'
            : 'history.streakDraw',
        { count: stats.streak.length },
      )
    : t('history.none');

  const tiles: [string, string][] = [
    [t('history.played'), String(stats.played)],
    [t('history.wins'), String(stats.wins)],
    [t('history.losses'), String(stats.losses)],
    [t('history.draws'), String(stats.draws)],
    [t('history.winRate'), stats.winRate === null ? t('history.none') : formatPercent(stats.winRate, i18n.language)],
    [t('history.streak'), streak],
    [t('history.bestStreak'), String(stats.bestWinStreak)],
  ];

  return (
    <div className="flex flex-col gap-3">
      <StatTiles tiles={tiles} className="lg:grid-cols-7" />
      {!finished.data.complete && (
        <p className="text-sm text-muted">{t('history.statsPartial', { count: finished.data.items.length })}</p>
      )}
    </div>
  );
}
