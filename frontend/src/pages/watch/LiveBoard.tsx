import { useTranslation } from 'react-i18next';
import { GameBoard } from '@/features/game/components/GameBoard';
import { GameStatus } from '@/features/game/components/GameStatus';
import { MoveAnnouncer } from '@/features/game/components/MoveAnnouncer';
import { PlayersBar } from '@/features/game/components/PlayersBar';
import { toBoardTheme } from '@/features/game/settings';
import { toBoardModel } from '@/features/matches/model';
import type { Match } from '@/features/matches/types';
import { liveAnnouncement, liveBanner, seatName } from './spectatorTexts';

/** A match in progress: the board follows the players, nothing can be played from here. */
export function LiveBoard({ match }: { match: Match }) {
  const { t } = useTranslation();
  const banner = liveBanner(match, t);

  return (
    <>
      <PlayersBar
        theme={toBoardTheme(match.settings.theme)}
        names={[seatName(match, 1), seatName(match, 2)]}
        activeSeat={match.game.current}
      />
      <GameStatus tone={banner.tone}>{banner.status}</GameStatus>
      <GameBoard theme={toBoardTheme(match.settings.theme)} model={toBoardModel(match)} />
      <MoveAnnouncer text={liveAnnouncement(match, t)} />
    </>
  );
}
