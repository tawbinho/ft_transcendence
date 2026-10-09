import { useTranslation } from 'react-i18next';
import { SlidersIcon, TrophyIcon, UsersIcon } from '@/components/icons';

/** Three short reasons to look around, under the ways to play. */
export function FeaturePoints() {
  const { t } = useTranslation();
  const points = [
    { icon: <SlidersIcon />, title: t('home.customTitle'), body: t('home.customBody') },
    { icon: <TrophyIcon />, title: t('home.points.tournaments.title'), body: t('home.points.tournaments.body') },
    { icon: <UsersIcon />, title: t('home.points.community.title'), body: t('home.points.community.body') },
  ];

  return (
    <section aria-labelledby="points-title" className="flex flex-col gap-6">
      <h2 id="points-title" className="text-2xl font-bold">
        {t('home.points.title')}
      </h2>
      <ul className="grid gap-4 md:grid-cols-3">
        {points.map((point) => (
          <li key={point.title} className="flex gap-4 rounded-2xl border border-border bg-surface-2 p-5">
            <span className="grid size-11 flex-none place-items-center rounded-xl bg-surface text-2xl text-primary">
              {point.icon}
            </span>
            <div className="min-w-0">
              <h3 className="text-lg font-bold">{point.title}</h3>
              <p className="text-muted">{point.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
