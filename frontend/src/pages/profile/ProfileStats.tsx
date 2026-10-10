import { useTranslation } from 'react-i18next';
import { StatTiles } from '@/components/StatTiles';
import { Card, ProgressBar } from '@/components/ui';
import { levelOf, winRate, XP_PER_LEVEL } from '@/features/users/achievements';
import type { ProfileStats as Stats } from '@/features/users/types';
import { formatPercent } from '@/lib/format';

/** Result tiles, then the level with a bar showing how far the next one is. */
export function ProfileStats({ stats }: { stats: Stats }) {
  const { t, i18n } = useTranslation();
  const level = levelOf(stats);
  const rate = winRate(stats);

  return (
    <section aria-labelledby="profile-stats" className="flex flex-col gap-4">
      <h2 id="profile-stats" className="text-xl font-bold">
        {t('profile.statsTitle')}
      </h2>
      <StatTiles
        className="lg:grid-cols-5"
        tiles={[
          [t('profile.played'), String(stats.played)],
          [t('profile.wins'), String(stats.wins)],
          [t('profile.losses'), String(stats.losses)],
          [t('profile.draws'), String(stats.draws)],
          [t('profile.winRate'), rate === null ? t('profile.noWinRate') : formatPercent(rate, i18n.language)],
        ]}
      />
      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="text-lg font-bold">{t('profile.level', { level: level.level })}</h3>
          <p className="text-sm text-muted">
            {t('profile.xpTotal', { xp: level.xp })} ·{' '}
            {t('profile.xpToNext', { xp: level.xpToNext, next: level.level + 1 })}
          </p>
        </div>
        <ProgressBar value={level.xpInLevel} max={XP_PER_LEVEL} label={t('profile.xpBar', { next: level.level + 1 })} />
        <p className="text-sm text-muted">{t('profile.xpNote')}</p>
      </Card>
    </section>
  );
}
