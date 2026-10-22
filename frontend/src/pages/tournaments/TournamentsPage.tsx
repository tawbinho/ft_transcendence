import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { GlobeIcon, PlusIcon } from '@/components/icons';
import { ModeCard } from '@/components/ModeCard';
import { PageHeader } from '@/components/PageHeader';
import { buttonClass } from '@/components/ui';
import { useCurrentUser } from '@/features/auth/hooks';
import { TournamentList } from './online/TournamentList';

/** The tournaments hub: how online tournaments work, then their list for members. */
export function TournamentsPage() {
  const { t } = useTranslation();
  const { data: user } = useCurrentUser();

  return (
    <>
      <PageHeader title={t('tournaments.title')} subtitle={t('tournaments.subtitle')} />
      <div className="mb-10 max-w-xl">
        <ModeCard icon={<GlobeIcon />} title={t('tournaments.onlineTitle')} body={t('tournaments.onlineBody')}>
          {user ? (
            <Link to="/tournaments/new" className={buttonClass({ block: true })}>
              <PlusIcon />
              {t('tournaments.create')}
            </Link>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted">{t('tournaments.loginRequired')}</p>
              <Link to="/login" state={{ from: { pathname: '/tournaments' } }} className={buttonClass({ block: true })}>
                {t('nav.login')}
              </Link>
            </div>
          )}
        </ModeCard>
      </div>
      {user && <TournamentList />}
    </>
  );
}
