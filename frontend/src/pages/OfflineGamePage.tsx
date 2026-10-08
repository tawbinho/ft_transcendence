import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshIcon, SlidersIcon, UndoIcon } from '@/components/icons';
import { PageHeader } from '@/components/PageHeader';
import { Button, Card, OptionGroup, TextField } from '@/components/ui';
import { DIFFICULTIES, type Difficulty } from '@/features/game/bot';
import { Board } from '@/features/game/components/Board';
import { BoardSettingsFields } from '@/features/game/components/BoardSettingsFields';
import { GameSummary } from '@/features/game/components/GameSummary';
import { PlayerTag } from '@/features/game/components/PlayerTag';
import { createGame, type GameState, type Seat } from '@/features/game/engine';
import { DEFAULT_BOARD_SETTINGS, type BoardSettings } from '@/features/game/settings';
import { useOfflineGame, type Opponent } from '@/features/game/useOfflineGame';
import { cn } from '@/lib/cn';

type Mode = 'local' | 'computer';
type FirstPlayer = 'you' | 'computer' | 'random';

interface Session {
  id: number;
  settings: BoardSettings;
  opponent: Opponent;
  /** Names typed for a same-screen game ('' = default "Player n"). */
  names: [string, string];
}

export function LocalGamePage() {
  return <OfflineGamePage mode="local" />;
}

export function ComputerGamePage() {
  return <OfflineGamePage mode="computer" />;
}

function OfflineGamePage({ mode }: { mode: Mode }) {
  const { t } = useTranslation();
  const title = mode === 'local' ? t('offline.localTitle') : t('offline.computerTitle');

  const [settings, setSettings] = useState<BoardSettings>(DEFAULT_BOARD_SETTINGS);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [firstPlayer, setFirstPlayer] = useState<FirstPlayer>('you');
  const [names, setNames] = useState<[string, string]>(['', '']);
  const [session, setSession] = useState<Session | null>(null);

  function start(event: FormEvent) {
    event.preventDefault();
    let opponent: Opponent = { kind: 'human' };
    if (mode === 'computer') {
      const computerFirst = firstPlayer === 'computer' || (firstPlayer === 'random' && Math.random() < 0.5);
      opponent = { kind: 'computer', difficulty, computerSeat: computerFirst ? 1 : 2 };
    }
    setSession({ id: Date.now(), settings, opponent, names: [names[0].trim(), names[1].trim()] });
  }

  if (session) {
    return (
      <OfflineGameView key={session.id} title={title} session={session} onChangeSettings={() => setSession(null)} />
    );
  }

  const preview = createGame(settings);

  return (
    <>
      <PageHeader title={title} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <form onSubmit={start} className="flex flex-col gap-7">
            <h2 className="sr-only">{t('offline.setupTitle')}</h2>
            {mode === 'computer' ? (
              <>
                <OptionGroup
                  legend={t('difficulty.label')}
                  variant="cards"
                  value={difficulty}
                  onChange={setDifficulty}
                  options={DIFFICULTIES.map((level) => ({
                    value: level,
                    label: t(`difficulty.${level}`),
                    description: t(`difficulty.${level}Hint`),
                  }))}
                />
                <OptionGroup
                  legend={t('offline.firstPlayer')}
                  value={firstPlayer}
                  onChange={setFirstPlayer}
                  options={[
                    { value: 'you', label: t('offline.youFirst') },
                    { value: 'computer', label: t('offline.computerFirst') },
                    { value: 'random', label: t('offline.randomFirst') },
                  ]}
                />
              </>
            ) : (
              <fieldset className="grid gap-4 sm:grid-cols-2">
                <legend className="mb-3 text-lg font-bold">{t('offline.players')}</legend>
                {([0, 1] as const).map((index) => (
                  <TextField
                    key={index}
                    label={
                      <>
                        {t('offline.playerName', { n: index + 1 })}{' '}
                        <span className="font-normal text-muted">({t('common.optional')})</span>
                      </>
                    }
                    value={names[index]}
                    maxLength={20}
                    placeholder={index === 0 ? t('offline.player1') : t('offline.player2')}
                    onChange={(event) => {
                      const next: [string, string] = [...names];
                      next[index] = event.target.value;
                      setNames(next);
                    }}
                  />
                ))}
              </fieldset>
            )}
            <BoardSettingsFields value={settings} onChange={setSettings} />
            <Button type="submit" size="lg" className="self-start">
              {t('offline.start')}
            </Button>
          </form>
        </Card>
        <div className="lg:sticky lg:top-24">
          <Board
            theme={settings.theme}
            model={{ ...preview.settings, board: preview.board, lastMove: null, winningLine: null }}
          />
        </div>
      </div>
    </>
  );
}

function OfflineGameView({
  title,
  session,
  onChangeSettings,
}: {
  title: string;
  session: Session;
  onChangeSettings: () => void;
}) {
  const { t } = useTranslation();
  const { settings, opponent } = session;
  const { game, moves, play, undo, canUndo, restart, computerThinking } = useOfflineGame(settings, opponent);

  const computerSeat = opponent.kind === 'computer' ? opponent.computerSeat : null;
  const nameOf = (seat: Seat): string => {
    if (computerSeat !== null) return seat === computerSeat ? t('offline.computer') : t('offline.you');
    return session.names[seat - 1] || (seat === 1 ? t('offline.player1') : t('offline.player2'));
  };

  const result = resultText(game, computerSeat, nameOf, t);
  const status =
    result ??
    (computerThinking
      ? t('offline.thinking')
      : computerSeat !== null
        ? t('game.yourTurn')
        : t('game.turnOf', { name: nameOf(game.current) }));

  // Screen readers hear each move and the result, not the whole board.
  const lastSeat: Seat = moves.length % 2 === 1 ? 1 : 2;
  const announcement = game.lastMove
    ? [t('game.playedColumn', { name: nameOf(lastSeat), n: game.lastMove.col + 1 }), result].filter(Boolean).join(' ')
    : '';

  const over = game.status !== 'playing';
  const humanWon = computerSeat !== null && game.status === 'won' && game.winner !== computerSeat;
  const humanLost = computerSeat !== null && game.status === 'won' && game.winner === computerSeat;

  return (
    <>
      <PageHeader title={title} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            {([1, 2] as const).map((seat) => (
              <PlayerTag
                key={seat}
                seat={seat}
                theme={settings.theme}
                name={nameOf(seat)}
                note={t(`themes.${settings.theme}.seat${seat}`)}
                active={!over && game.current === seat}
                align={seat === 2 ? 'end' : 'start'}
              />
            ))}
          </div>
          <p
            className={cn(
              'rounded-xl px-4 py-2 text-center text-lg font-bold',
              humanWon && 'bg-success-soft text-success',
              humanLost && 'bg-danger-soft text-danger',
              over && !humanWon && !humanLost && 'bg-surface-2',
            )}
          >
            {status}
          </p>
          <Board
            theme={settings.theme}
            model={{ ...settings, board: game.board, lastMove: game.lastMove, winningLine: game.winningLine }}
            onPlay={play}
            disabled={over || computerThinking}
            previewSeat={over || computerThinking ? null : game.current}
          />
        </div>

        <aside className="flex flex-col gap-4">
          <Card className="flex flex-col gap-2 p-4 sm:p-4">
            <Button variant={over ? 'primary' : 'secondary'} onClick={restart} disabled={moves.length === 0}>
              <RefreshIcon />
              {t('offline.restart')}
            </Button>
            <Button variant="secondary" onClick={undo} disabled={!canUndo}>
              <UndoIcon />
              {t('offline.undo')}
            </Button>
            <Button variant="ghost" onClick={onChangeSettings}>
              <SlidersIcon />
              {t('offline.changeSettings')}
            </Button>
          </Card>
          <GameSummary
            settings={settings}
            moveCount={game.moveCount}
            difficulty={opponent.kind === 'computer' ? opponent.difficulty : undefined}
          />
        </aside>
      </div>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </>
  );
}

function resultText(
  game: GameState,
  computerSeat: Seat | null,
  nameOf: (seat: Seat) => string,
  t: ReturnType<typeof useTranslation>['t'],
): string | null {
  if (game.status === 'draw') return t('game.draw');
  if (game.status !== 'won' || game.winner === null) return null;
  if (computerSeat !== null) return game.winner === computerSeat ? t('game.youLose') : t('game.youWin');
  return t('game.wins', { name: nameOf(game.winner) });
}
