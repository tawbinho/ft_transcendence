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

/** A card's button: for a visitor on a page that needs an account, it says so and leads to the login page. */
function ActionLink({
  to,
  needsLogin,
  label,
  loginLabel,
  primary,
}: {
  to: string;
  needsLogin: boolean;
  label: string;
  loginLabel: string;
  primary?: boolean;
}) {
  const className = buttonClass({ variant: primary ? 'primary' : 'secondary', block: true });
  // After logging in, the visitor is sent on to the page they chose.
  if (needsLogin)
    return (
      <Link to="/login" state={{ from: { pathname: to } }} className={className}>
        {loginLabel}
      </Link>
    );
  return (
    <Link to={to} className={className}>
      {label}
    </Link>
  );
}

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
            <ActionLink
              to="/play/computer"
              needsLogin={!user}
              label={t('play.computer.action')}
              loginLabel={t('play.computer.loginAction')}
            />
          </ModeCard>
          <ModeCard icon={<GlobeIcon />} title={t('play.online.title')} body={t('play.online.body')}>
            <ActionLink
              primary
              to="/play/online"
              needsLogin={!user}
              label={t('play.online.action')}
              loginLabel={t('play.online.loginAction')}
            />
          </ModeCard>
          <ModeCard icon={<TrophyIcon />} title={t('play.tournament.title')} body={t('play.tournament.body')}>
            <ActionLink
              to="/tournaments"
              needsLogin={!user}
              label={t('play.tournament.action')}
              loginLabel={t('play.tournament.loginAction')}
            />
          </ModeCard>
        </div>
        <PlayAgain />
        <HowToPlay />
      </div>
    </>
  );
}
