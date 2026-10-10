import { useTranslation } from 'react-i18next';
import { LockIcon, MedalIcon } from '@/components/icons';
import { badgesOf } from '@/features/users/achievements';
import type { ProfileStats } from '@/features/users/types';
import { cn } from '@/lib/cn';

/** Every badge, earned ones highlighted. They are computed from the match results, nothing is stored. */
export function Achievements({ stats }: { stats: ProfileStats }) {
  const { t } = useTranslation();
  const badges = badgesOf(stats);
  const earned = badges.filter((badge) => badge.earned).length;

  return (
    <section aria-labelledby="profile-achievements" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="profile-achievements" className="text-xl font-bold">
          {t('profile.achievementsTitle')}
        </h2>
        <p className="text-sm text-muted">{t('profile.achievementsCount', { earned, total: badges.length })}</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {badges.map((badge) => (
          <li
            key={badge.id}
            className={cn(
              'flex items-center gap-3 rounded-xl border p-4',
              badge.earned ? 'border-primary/40 bg-primary/12' : 'border-border bg-surface',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-full',
                badge.earned ? 'bg-primary text-primary-fg' : 'bg-surface-2 text-muted',
              )}
            >
              {badge.earned ? <MedalIcon /> : <LockIcon />}
            </span>
            <div className="min-w-0">
              <p className="font-semibold">
                {t(`profile.badges.${badge.id}.name`)}
                <span className="sr-only"> ({badge.earned ? t('profile.earned') : t('profile.locked')})</span>
              </p>
              <p className="text-sm text-muted">{t(`profile.badges.${badge.id}.hint`)}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted">{t('profile.achievementsNote')}</p>
    </section>
  );
}
