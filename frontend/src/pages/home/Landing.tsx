import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ModeCard } from '@/components/ModeCard';
import { ChipIcon, GlobeIcon, UsersIcon } from '@/components/icons';
import { buttonClass } from '@/components/ui';
import { Board } from '@/features/game/components/Board';
import { replay } from '@/features/game/engine';
import { FeaturePoints } from './FeaturePoints';

// A finished game for the hero picture: seat 1 wins on a diagonal.
const SHOWCASE = replay({}, [0, 1, 1, 2, 3, 2, 2, 3, 6, 3, 3]);

/** What a visitor sees: the game, three ways to play (the online one needs an account) and what else is here. */
export function Landing() {
  const { t } = useTranslation();

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
            <Link to="/signup" className={buttonClass({ size: 'lg', variant: 'secondary' })}>
              {t('home.createAccount')}
            </Link>
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
          <ModeCard to="/signup" icon={<GlobeIcon />} title={t('home.onlineGuestTitle')} body={t('home.online.body')} />
        </div>
      </section>

      <FeaturePoints />
    </div>
  );
}
