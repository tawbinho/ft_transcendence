import { useTranslation } from 'react-i18next';
import { LoadError } from '@/components/LoadError';
import { StatTiles } from '@/components/StatTiles';
import { ProgressBar, Skeleton } from '@/components/ui';
import { winRate } from '@/features/users/achievements';
import { useProfile } from '@/features/users/hooks';
import { formatPercent } from '@/lib/format';

/** The player's numbers, counted by the server: the same `stats` as on their profile page. */
export function HistoryStats({ displayName }: { displayName: string }) {
  const { t, i18n } = useTranslation();
  const profile = useProfile(displayName);

  if (profile.isPending) {
    return (
      <div role="status" className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        <span className="sr-only">{t('common.loading')}</span>
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }
  if (profile.error) {
    return <LoadError error={profile.error} onRetry={() => void profile.refetch()} retrying={profile.isRefetching} />;
  }

  const { stats } = profile.data;
  const rate = winRate(stats);
  const tiles: [string, string][] = [
    [t('history.played'), String(stats.played)],
    [t('history.wins'), String(stats.wins)],
    [t('history.losses'), String(stats.losses)],
    [t('history.draws'), String(stats.draws)],
    [t('history.winRate'), rate === null ? t('history.none') : formatPercent(rate, i18n.language)],
  ];

  return (
    <div className="flex flex-col gap-3">
      <StatTiles tiles={tiles} className="lg:grid-cols-5" />
      {rate !== null && (
        <div className="flex flex-col gap-1.5">
          <p className="text-sm text-muted">{t('history.winRateBar')}</p>
          <ProgressBar value={rate * 100} label={t('history.winRateBar')} />
        </div>
      )}
    </div>
  );
}
