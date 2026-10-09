import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { GameBoard } from '@/features/game/components/GameBoard';
import { GameStatus } from '@/features/game/components/GameStatus';
import { PlayersBar } from '@/features/game/components/PlayersBar';
import { toBoardTheme } from '@/features/game/settings';
import { positionAfter, replayFrames, toReplayModel } from '@/features/matches/replay';
import type { Match } from '@/features/matches/types';
import { ReplayControls } from './ReplayControls';
import { replayAnnouncement, replayBanner, seatName } from './spectatorTexts';
import { useReplay } from './useReplay';

/** A finished match, replayed move by move. */
export function ReplayBoard({ match }: { match: Match }) {
  const { t } = useTranslation();
  const theme = toBoardTheme(match.settings.theme);

  // Every position is worked out once; the buttons only pick one of them.
  const frames = useMemo(() => replayFrames(match.settings, match.game.moves), [match.settings, match.game.moves]);
  const total = frames.length - 1;
  const replay = useReplay(total);
  const position = positionAfter(frames, replay.step);
  const banner = replayBanner(match, replay.step, total, t);

  return (
    <>
      <PlayersBar
        theme={theme}
        names={[seatName(match, 1), seatName(match, 2)]}
        // The player who moves next, as long as the replay has not reached the end.
        activeSeat={replay.step < total ? position.current : null}
      />
      <GameStatus tone={banner.tone} detail={banner.detail}>
        {banner.status}
      </GameStatus>
      <GameBoard theme={theme} model={toReplayModel(position)} />
      {total > 0 && (
        <ReplayControls
          step={replay.step}
          total={total}
          playing={replay.playing}
          announcement={replayAnnouncement(match, replay.step, total, t)}
          onStep={replay.goTo}
          onTogglePlay={replay.togglePlay}
        />
      )}
    </>
  );
}
