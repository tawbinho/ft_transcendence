import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { Button, Card, OptionGroup, TextField } from '@/components/ui';
import { DIFFICULTIES } from '@/features/game/bot';
import { BoardSettingsFields } from '@/features/game/components/BoardSettingsFields';
import { GameBoard } from '@/features/game/components/GameBoard';
import { createGame } from '@/features/game/engine';
import { saveLastSettings } from '@/features/game/lastSettings';
import { buildSession, startingValues, type FirstPlayer, type Mode, type Session } from './session';

/** The form before a same-screen or computer game: players or level, then the board. */
export function OfflineSetup({
  mode,
  title,
  onStart,
}: {
  mode: Mode;
  title: string;
  onStart: (session: Session) => void;
}) {
  const { t } = useTranslation();
  const [values, setValues] = useState(startingValues);
  const { settings, difficulty, firstPlayer, names } = values;
  const change = (patch: Partial<typeof values>) => setValues({ ...values, ...patch });

  function start(event: FormEvent) {
    event.preventDefault();
    // The next form, here or online, starts from this board.
    saveLastSettings(settings);
    onStart(buildSession(mode, values));
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
                  onChange={(level) => change({ difficulty: level })}
                  options={DIFFICULTIES.map((level) => ({
                    value: level,
                    label: t(`difficulty.${level}`),
                    description: t(`difficulty.${level}Hint`),
                  }))}
                />
                <OptionGroup<FirstPlayer>
                  legend={t('offline.firstPlayer')}
                  value={firstPlayer}
                  onChange={(first) => change({ firstPlayer: first })}
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
                      change({ names: next });
                    }}
                  />
                ))}
              </fieldset>
            )}
            <BoardSettingsFields value={settings} onChange={(next) => change({ settings: next })} />
            <Button type="submit" size="lg" className="self-start">
              {t('offline.start')}
            </Button>
          </form>
        </Card>
        <div className="lg:sticky lg:top-24">
          <GameBoard
            theme={settings.theme}
            model={{ ...preview.settings, board: preview.board, lastMove: null, winningLine: null }}
          />
        </div>
      </div>
    </>
  );
}
