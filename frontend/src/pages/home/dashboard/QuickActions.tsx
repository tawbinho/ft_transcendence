import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ChipIcon, GlobeIcon, TrophyIcon, UsersIcon } from '@/components/icons';
import { buttonClass } from '@/components/ui';

/** Buttons that start a game in one click. */
export function QuickActions() {
  const { t } = useTranslation();
  const actions = [
    { to: '/play/online', icon: <GlobeIcon />, label: t('home.quick.online'), primary: true },
    { to: '/play/computer', icon: <ChipIcon />, label: t('home.quick.computer') },
    { to: '/play/local', icon: <UsersIcon />, label: t('home.quick.local') },
    { to: '/tournaments', icon: <TrophyIcon />, label: t('home.quick.tournaments') },
  ];

  return (
    <section aria-label={t('home.quick.title')} className="flex flex-wrap gap-3">
      {actions.map((action) => (
        <Link
          key={action.to}
          to={action.to}
          className={buttonClass({ variant: action.primary ? 'primary' : 'secondary', size: 'lg' })}
        >
          <span aria-hidden="true" className="text-xl">
            {action.icon}
          </span>
          {action.label}
        </Link>
      ))}
    </section>
  );
}
