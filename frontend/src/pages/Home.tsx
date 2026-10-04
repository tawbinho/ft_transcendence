import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { canDrop, createGame, drop } from '@cf/engine';
import type { LeaderboardEntryDTO } from '@cf/shared';
import { api } from '../lib/api';
import { Board } from '../features/game/Board';
import { Button, Card } from '../components/ui';

const SAMPLE_MOVES = [3, 3, 4, 2, 4, 4, 5, 2, 3, 1];
function sampleGame() {
  return SAMPLE_MOVES.reduce((game, col) => (canDrop(game, col) ? drop(game, col) : game), createGame());
}

const MODES = [
  { icon: '🎮', color: 'bg-disc1', title: 'home.live', desc: 'home.liveDesc' },
  { icon: '🤖', color: 'bg-accent', title: 'home.ai', desc: 'home.aiDesc' },
  { icon: '👀', color: 'bg-disc2', title: 'home.spectate', desc: 'home.spectateDesc' },
  { icon: '🏆', color: 'bg-success', title: 'home.tournaments', desc: 'home.tournamentsDesc' },
];

export function Home() {
  const { t } = useTranslation();
  const game = useMemo(sampleGame, []);
  const [top, setTop] = useState<LeaderboardEntryDTO[]>([]);

  useEffect(() => {
    api
      .get<LeaderboardEntryDTO[]>('/api/leaderboard')
      .then((rows) => setTop(rows.slice(0, 5)))
      .catch(() => setTop([]));
  }, []);

  return (
    <div className="space-y-16">
      <section className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <h1 className="whitespace-pre-line font-display text-5xl font-extrabold leading-[1.05] sm:text-6xl">
            {t('home.title')}
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted">{t('home.subtitle')}</p>
          <div className="mt-7 flex flex-wrap gap-4">
            <Link to="/play">
              <Button variant="primary">{t('home.challenge')}</Button>
            </Link>
            <Link to="/play">
              <Button variant="secondary">{t('home.playAI')}</Button>
            </Link>
          </div>
        </div>
        <div className="mx-auto w-full max-w-sm">
          <Board game={game} />
        </div>
      </section>

      <section>
        <h2 className="mb-6 font-display text-3xl font-bold">{t('home.modesTitle')}</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {MODES.map((mode) => (
            <Card key={mode.title}>
              <div
                className={`mb-4 grid h-12 w-12 place-items-center rounded-2xl text-2xl text-white shadow-clay-sm ${mode.color}`}
                aria-hidden
              >
                {mode.icon}
              </div>
              <h3 className="font-display text-lg font-bold">{t(mode.title)}</h3>
              <p className="mt-1 text-sm text-muted">{t(mode.desc)}</p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-6 font-display text-3xl font-bold">{t('home.ladder')}</h2>
        <Card className="max-w-xl">
          <ol className="divide-y divide-well">
            {top.map((entry) => (
              <li key={entry.user.id} className="flex items-center gap-4 py-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-well font-display font-extrabold shadow-clay-sm">
                  {entry.rank}
                </span>
                <span className="font-bold">{entry.user.displayName}</span>
                <span className="ms-auto font-display text-muted">{entry.user.rating}</span>
              </li>
            ))}
            {top.length === 0 && <li className="py-3 text-muted">{t('leaderboard.empty')}</li>}
          </ol>
        </Card>
      </section>
    </div>
  );
}
