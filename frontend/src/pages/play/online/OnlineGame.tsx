import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlagIcon } from '@/components/icons';
import { PageHeader } from '@/components/PageHeader';
import { Alert, Button, ConfirmDialog } from '@/components/ui';
import { GameBoard } from '@/features/game/components/GameBoard';
import { GameLayout } from '@/features/game/components/GameLayout';
import { GameStatus } from '@/features/game/components/GameStatus';
import { GameSummary } from '@/features/game/components/GameSummary';
import { MoveAnnouncer } from '@/features/game/components/MoveAnnouncer';
import { PlayersBar } from '@/features/game/components/PlayersBar';
import { toBoardTheme } from '@/features/game/settings';
import { useMakeMove, useResignMatch } from '@/features/matches/hooks';
import { isMyTurn, outcomeOf, toBoardModel } from '@/features/matches/model';
import type { Match } from '@/features/matches/types';
import { useErrorMessage } from '@/lib/errorMessage';
import { Celebration } from '../components/Celebration';
import { KeysHint } from '../components/KeysHint';
import { useJustWon } from '../components/useJustWon';
import { matchAnnouncement, matchDetail, matchStatus, matchTone, playerLabel, playerName } from './onlineText';
import { ResultActions } from './ResultActions';

/** A match with two players: the board, whose turn it is, resign while it lasts and the next steps after. */
export function OnlineGame({ match, syncFailed }: { match: Match; syncFailed: boolean }) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const move = useMakeMove(match.id);
  const resign = useResignMatch(match.id);
  const [confirmingResign, setConfirmingResign] = useState(false);

  const theme = toBoardTheme(match.settings.theme);
  const playing = match.status === 'in_progress';
  const myTurn = isMyTurn(match);
  const celebrate = useJustWon(outcomeOf(match) === 'won');

  return (
    <>
      <PageHeader
        title={`${playerName(match, 1)} ${t('online.vs')} ${playerName(match, 2)}`}
        actions={
          playing && (
            <Button variant="secondary" onClick={() => setConfirmingResign(true)}>
              <FlagIcon />
              {t('online.resign')}
            </Button>
          )
        }
      />
      <GameLayout
        aside={
          <>
            {!playing && <ResultActions match={match} />}
            <GameSummary settings={match.settings} moveCount={match.game.moveCount} />
            {playing && <KeysHint />}
          </>
        }
      >
        <PlayersBar
          theme={theme}
          names={[playerLabel(match, 1, t), playerLabel(match, 2, t)]}
          activeSeat={playing ? match.game.current : null}
        />
        <GameStatus tone={matchTone(match)} detail={matchDetail(match, t)}>
          {matchStatus(match, t)}
        </GameStatus>

        {move.error && <Alert tone="danger">{errorMessage(move.error)}</Alert>}
        {resign.error && <Alert tone="danger">{errorMessage(resign.error)}</Alert>}
        {syncFailed && <Alert tone="warning">{t('online.syncError')}</Alert>}

        <GameBoard
          // The player can start dropping discs as soon as the match begins.
          autoFocus
          theme={theme}
          model={toBoardModel(match)}
          onPlay={
            playing
              ? (col) => {
                  move.reset();
                  move.mutate(col);
                }
              : undefined
          }
          disabled={!myTurn || move.isPending}
          previewSeat={myTurn ? match.yourSeat : null}
        />
      </GameLayout>

      <MoveAnnouncer text={matchAnnouncement(match, t)} />
      {celebrate && <Celebration theme={theme} />}

      <ConfirmDialog
        open={confirmingResign}
        title={t('online.resignTitle')}
        confirmLabel={t('online.resign')}
        confirmVariant="danger"
        loading={resign.isPending}
        onClose={() => setConfirmingResign(false)}
        onConfirm={() => resign.mutate(undefined, { onSettled: () => setConfirmingResign(false) })}
      >
        {t('online.resignBody')}
      </ConfirmDialog>
    </>
  );
}
