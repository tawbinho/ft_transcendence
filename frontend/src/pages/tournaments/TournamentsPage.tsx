import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { PlusIcon } from '@/components/icons';
import { PageHeader } from '@/components/PageHeader';
import { buttonClass } from '@/components/ui';
import { useCurrentUser } from '@/features/auth/hooks';
import { TournamentList } from './online/TournamentList';

/** The tournaments hub: their list and a "Create" button for members, a way to log in for visitors. */
export function TournamentsPage() {
  const { t } = useTranslation();
  const { data: user } = useCurrentUser();

  return (
    <>
      <PageHeader
        title={t('tournaments.title')}
        subtitle={t('tournaments.subtitle')}
        actions={
          user && (
            <Link to="/tournaments/new" className={buttonClass()}>
              <PlusIcon />
              {t('tournaments.create')}
            </Link>
          )
        }
      />
      {user ? (
        <TournamentList />
      ) : (
        <div className="flex flex-col items-start gap-3">
          <p className="text-muted">{t('tournaments.loginRequired')}</p>
          <Link to="/login" state={{ from: { pathname: '/tournaments' } }} className={buttonClass()}>
            {t('nav.login')}
          </Link>
        </div>
      )}
    </>
  );
}
