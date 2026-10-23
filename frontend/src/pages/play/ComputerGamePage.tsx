import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { paths } from '@/app/paths';
import { PageHeader } from '@/components/PageHeader';
import { Alert, Button, Card, OptionGroup } from '@/components/ui';
import { Board } from '@/features/game/components/Board';
import { BoardSettingsFields } from '@/features/game/components/BoardSettingsFields';
import { createGame } from '@/features/game/engine';
import { loadLastSettings, saveLastSettings } from '@/features/game/lastSettings';
import type { BoardSettings } from '@/features/game/settings';
import { useCreateMatch } from '@/features/matches/hooks';
import { COMPUTER_PLAYERS, DEFAULT_COMPUTER_PLAYER } from '@/features/users/computerPlayers';
import { useErrorMessage } from '@/lib/errorMessage';

/**
 * /play/computer: choose a level and a board. "Start game" creates an online match against that
 * level's computer account; the server joins it at once and plays the computer's moves.
 */
export function ComputerGamePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const errorMessage = useErrorMessage();
  const create = useCreateMatch();
  const [computer, setComputer] = useState<string>(DEFAULT_COMPUTER_PLAYER);
  const [settings, setSettings] = useState<BoardSettings>(loadLastSettings);

  function start(event: FormEvent) {
    event.preventDefault();
    saveLastSettings(settings);
    create.mutate(
      { settings, opponentDisplayName: computer },
      { onSuccess: (match) => void navigate(paths.match(match.id)) },
    );
  }

  const preview = createGame(settings);

  return (
    <>
      <PageHeader title={t('play.computer.title')} subtitle={t('play.computer.subtitle')} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <form onSubmit={start} className="flex flex-col gap-7">
            {create.error && <Alert tone="danger">{errorMessage(create.error)}</Alert>}
            <OptionGroup
              legend={t('difficulty.label')}
              variant="cards"
              value={computer}
              onChange={setComputer}
              options={COMPUTER_PLAYERS.map((player) => ({
                value: player.displayName,
                label: t(`difficulty.${player.level}`),
                description: t(`difficulty.${player.level}Hint`),
              }))}
            />
            <BoardSettingsFields value={settings} onChange={setSettings} />
            <Button type="submit" size="lg" className="self-start" loading={create.isPending}>
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
