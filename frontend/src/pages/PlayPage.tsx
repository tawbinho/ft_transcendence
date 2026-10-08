import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ChipIcon, GlobeIcon, TrophyIcon, UsersIcon } from '@/components/icons';
import { PageHeader } from '@/components/PageHeader';
import { buttonClass } from '@/components/ui';
import { useCurrentUser } from '@/features/auth/hooks';

function ModeCard({
  icon,
  title,
  body,
  children,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <span className="grid size-12 place-items-center rounded-xl bg-primary/12 text-2xl text-primary">{icon}</span>
      <div className="flex-1">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="mt-1 text-muted">{body}</p>
      </div>
      {children}
    </section>
  );
}

export function PlayPage() {
  const { t } = useTranslation();
  const { data: user } = useCurrentUser();

  return (
    <>
      <PageHeader title={t('play.title')} subtitle={t('play.subtitle')} />
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
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted">{t('play.online.loginRequired')}</p>
              <Link to="/login" state={{ from: { pathname: '/play/online' } }} className={buttonClass({ block: true })}>
                {t('nav.login')}
              </Link>
            </div>
          )}
        </ModeCard>
        <ModeCard icon={<TrophyIcon />} title={t('play.tournament.title')} body={t('play.tournament.body')}>
          <Link to="/tournaments" className={buttonClass({ variant: 'secondary', block: true })}>
            {t('play.tournament.action')}
          </Link>
        </ModeCard>
      </div>
    </>
  );
}
