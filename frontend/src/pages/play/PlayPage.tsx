import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ChipIcon, GlobeIcon, TrophyIcon, UsersIcon } from '@/components/icons';
import { ModeCard } from '@/components/ModeCard';
import { PageHeader } from '@/components/PageHeader';
import { buttonClass } from '@/components/ui';
import { useCurrentUser } from '@/features/auth/hooks';
import { HowToPlay } from './components/HowToPlay';
import { OpenMatchNotice } from './online/OpenMatchNotice';

/** A card's button: a visitor sees a plain "Log in" on the pages that need an account, then goes on to the page they chose. */
function ActionLink({
  to,
  label,
  needsLogin,
  primary,
}: {
  to: string;
  label: string;
  needsLogin: boolean;
  primary?: boolean;
}) {
  const { t } = useTranslation();
  const className = buttonClass({ variant: primary ? 'primary' : 'secondary', block: true });
  if (needsLogin) {
    return (
      <Link to="/login" state={{ from: { pathname: to } }} className={className}>
        {t('nav.login')}
      </Link>
    );
  }
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
            <ActionLink to="/play/computer" needsLogin={!user} label={t('play.computer.action')} />
          </ModeCard>
          <ModeCard icon={<GlobeIcon />} title={t('play.online.title')} body={t('play.online.body')}>
            <ActionLink primary to="/play/online" needsLogin={!user} label={t('play.online.action')} />
          </ModeCard>
          <ModeCard icon={<TrophyIcon />} title={t('play.tournament.title')} body={t('play.tournament.body')}>
            <ActionLink to="/tournaments" needsLogin={!user} label={t('play.tournament.action')} />
          </ModeCard>
        </div>
        <HowToPlay />
      </div>
    </>
  );
}
