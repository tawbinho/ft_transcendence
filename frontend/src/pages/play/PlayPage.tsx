import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ChipIcon, GlobeIcon, TrophyIcon, UsersIcon } from '@/components/icons';
import { ModeCard } from '@/components/ModeCard';
import { PageHeader } from '@/components/PageHeader';
import { buttonClass } from '@/components/ui';
import { useCurrentUser } from '@/features/auth/hooks';
import { HowToPlay } from './components/HowToPlay';
import { PlayAgain } from './components/PlayAgain';
import { OpenMatchNotice } from './online/OpenMatchNotice';

/** The play hub: the four ways to play, a quick restart of the same-screen game and the rules. */
export function PlayPage() {
  const { t } = useTranslation();
  const { data: user } = useCurrentUser();

  return (
    <>
      <PageHeader title={t('play.title')} subtitle={t('play.subtitle')} />
      <div className="flex flex-col gap-6">
        {user && <OpenMatchNotice />}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ModeCard icon={<UsersIcon />} title={t('play.local.title')} body={t('play.local.body')}>
            <Link to="/play/local" className={buttonClass({ variant: 'secondary', block: true })}>
              {t('play.local.action')}
            </Link>
          </ModeCard>
          <ModeCard icon={<ChipIcon />} title={t('play.computer.title')} body={t('play.computer.body')}>
            <Link to="/play/computer" className={buttonClass({ variant: 'secondary', block: true })}>
              {t('play.computer.action')}
            </Link>
          </ModeCard>
          <ModeCard icon={<GlobeIcon />} title={t('play.online.title')} body={t('play.online.body')}>
            {user ? (
              <Link to="/play/online" className={buttonClass({ block: true })}>
                {t('play.online.action')}
              </Link>
            ) : (
              // A visitor is sent back to the online form after logging in.
              <Link to="/login" state={{ from: { pathname: '/play/online' } }} className={buttonClass({ block: true })}>
                {t('play.online.loginAction')}
              </Link>
            )}
          </ModeCard>
          <ModeCard icon={<TrophyIcon />} title={t('play.tournament.title')} body={t('play.tournament.body')}>
            <Link to="/tournaments" className={buttonClass({ variant: 'secondary', block: true })}>
              {t('play.tournament.action')}
            </Link>
          </ModeCard>
        </div>
        <PlayAgain />
        <HowToPlay />
      </div>
    </>
  );
}
