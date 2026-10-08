import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ChipIcon, GlobeIcon, SlidersIcon, UsersIcon } from '@/components/icons';
import { buttonClass } from '@/components/ui';
import { useCurrentUser } from '@/features/auth/hooks';
import { Board } from '@/features/game/components/Board';
import { replay } from '@/features/game/engine';
import { useDocumentTitle } from '@/lib/useDocumentTitle';

// A finished game for the hero picture: seat 1 wins on a diagonal.
const SHOWCASE = replay({}, [0, 1, 1, 2, 3, 2, 2, 3, 6, 3, 3]);

function ModeCard({ to, icon, title, body }: { to: string; icon: ReactNode; title: string; body: string }) {
  return (
    <Link
      to={to}
      className="group flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
    >
      <span className="grid size-11 place-items-center rounded-xl bg-primary/12 text-2xl text-primary">{icon}</span>
      <h3 className="text-lg font-bold group-hover:text-primary">{title}</h3>
      <p className="text-muted">{body}</p>
    </Link>
  );
}

export function HomePage() {
  const { t } = useTranslation();
  const { data: user } = useCurrentUser();
  useDocumentTitle();

  return (
    <div className="flex flex-col gap-16">
      <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col gap-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">{t('home.title')}</h1>
          <p className="max-w-xl text-lg text-muted">{t('home.subtitle')}</p>
          <div className="flex flex-wrap gap-3">
            <Link to="/play" className={buttonClass({ size: 'lg' })}>
              {t('home.playNow')}
            </Link>
            {!user && (
              <Link to="/signup" className={buttonClass({ size: 'lg', variant: 'secondary' })}>
                {t('home.createAccount')}
              </Link>
            )}
          </div>
        </div>
        <Board
          theme="classic"
          className="max-w-md"
          model={{
            cols: SHOWCASE.settings.cols,
            rows: SHOWCASE.settings.rows,
            board: SHOWCASE.board,
            lastMove: null,
            winningLine: SHOWCASE.winningLine,
          }}
        />
      </section>

      <section aria-labelledby="modes-title" className="flex flex-col gap-6">
        <h2 id="modes-title" className="text-2xl font-bold">
          {t('home.modesTitle')}
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <ModeCard to="/play/local" icon={<UsersIcon />} title={t('home.local.title')} body={t('home.local.body')} />
          <ModeCard
            to="/play/computer"
            icon={<ChipIcon />}
            title={t('home.computer.title')}
            body={t('home.computer.body')}
          />
          <ModeCard
            to="/play/online"
            icon={<GlobeIcon />}
            title={t('home.online.title')}
            body={t('home.online.body')}
          />
        </div>
      </section>

      <section className="flex flex-col items-start gap-4 rounded-2xl border border-border bg-surface-2 p-6 sm:flex-row sm:items-center">
        <span className="grid size-11 flex-none place-items-center rounded-xl bg-surface text-2xl text-primary">
          <SlidersIcon />
        </span>
        <div>
          <h2 className="text-lg font-bold">{t('home.customTitle')}</h2>
          <p className="text-muted">{t('home.customBody')}</p>
        </div>
      </section>
    </div>
  );
}
