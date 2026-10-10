import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { GlobeIcon, PlusIcon, UsersIcon } from '@/components/icons';
import { ModeCard } from '@/components/ModeCard';
import { PageHeader } from '@/components/PageHeader';
import { buttonClass } from '@/components/ui';
import { useCurrentUser } from '@/features/auth/hooks';
import { loadLocalTournament } from '@/features/tournaments/local';
import { TournamentList } from './online/TournamentList';

/** The tournaments hub: two ways to play, and the list of online tournaments for members. */
export function TournamentsPage() {
  const { t } = useTranslation();
  const { data: user } = useCurrentUser();
  const localInProgress = loadLocalTournament() !== null;

  return (
    <>
      <PageHeader title={t('tournaments.title')} subtitle={t('tournaments.subtitle')} />
      <div className="mb-10 grid gap-4 md:grid-cols-2">
        <ModeCard icon={<UsersIcon />} title={t('localTournament.title')} body={t('localTournament.cardBody')}>
          <Link to="/tournaments/local" className={buttonClass({ variant: 'secondary', block: true })}>
            {localInProgress ? t('localTournament.resume') : t('localTournament.setUp')}
          </Link>
        </ModeCard>
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
