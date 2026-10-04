import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Difficulty } from '@cf/ai';
import { DEFAULT_MATCH } from '@cf/shared';
import { Board } from '../features/game/Board';
import { useLocalGame } from '../features/game/useLocalGame';
import { Button } from '../components/ui';

function toInt(value: string | null, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

export function LocalMatch({ vsAI }: { vsAI: boolean }) {
  const { t } = useTranslation();
  const [params] = useSearchParams();

  const settings = useMemo(
    () => ({
      cols: toInt(params.get('cols'), DEFAULT_MATCH.cols),
      rows: toInt(params.get('rows'), DEFAULT_MATCH.rows),
      winLength: toInt(params.get('winLength'), DEFAULT_MATCH.winLength),
    }),
    [params],
  );
  const difficulty = (params.get('difficulty') as Difficulty) ?? 'normal';

  const { game, play, reset } = useLocalGame(settings, vsAI ? difficulty : null);
  const color = (seat: 1 | 2) => (seat === 1 ? t('game.red') : t('game.yellow'));

  let status: string;
  if (game.status === 'draw') status = t('game.draw');
  else if (game.status === 'won')
    status = vsAI
      ? game.winner === 1
        ? t('game.youWon')
        : t('game.youLost')
      : t('game.wonBy', { name: color(game.winner!) });
  else if (vsAI) status = game.current === 1 ? t('game.yourTurn') : t('game.aiThinking');
  else status = t('game.turn', { color: color(game.current) });

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/play" className="text-sm text-muted underline underline-offset-2">
          ← {t('common.back')}
        </Link>
        <p className="rounded-2xl bg-raised px-4 py-2 font-display font-bold shadow-clay-sm">{status}</p>
      </div>

      <Board
        game={game}
        onDrop={play}
        disabled={vsAI && game.current !== 1 && game.status === 'playing'}
      />

      <p className="sr-only" aria-live="polite">
        {status}
      </p>

      {game.status !== 'playing' && (
        <div className="flex justify-center gap-3">
          <Button onClick={reset}>{t('game.rematch')}</Button>
          <Link to="/play">
            <Button variant="secondary">{t('common.back')}</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
