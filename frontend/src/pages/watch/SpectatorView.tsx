import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { BackIcon, EyeIcon } from '@/components/icons';
import { PageHeader } from '@/components/PageHeader';
import { Badge, buttonClass } from '@/components/ui';
import { GameLayout } from '@/features/game/components/GameLayout';
import { GameSummary } from '@/features/game/components/GameSummary';
import type { Match } from '@/features/matches/types';
import { LiveBoard } from './LiveBoard';
import { ReplayBoard } from './ReplayBoard';
import { seatName } from './spectatorTexts';

/**
 * A match seen from outside. While it is played, the board follows it live;
 * once it is over, the same page replays it move by move. A player of the match
 * can open the replay too (the history links here).
 */
export function SpectatorView({ match }: { match: Match }) {
  const { t } = useTranslation();
  const playing = match.status === 'in_progress';
  const played = match.yourSeat !== null;

  return (
    <>
      <PageHeader
        title={`${seatName(match, 1)} ${t('online.vs')} ${seatName(match, 2)}`}
        actions={
          <>
            {played && (
              <Link to="/matches" className={buttonClass({ variant: 'secondary' })}>
                {t('watch.myMatches')}
              </Link>
            )}
            <Link to="/watch" className={buttonClass({ variant: 'secondary' })}>
              <BackIcon />
              {t('watch.backToLive')}
            </Link>
          </>
        }
      />
      <GameLayout
        aside={
          <>
            <p className="flex flex-wrap items-center gap-2 text-muted">
              <EyeIcon />
              {playing ? <Badge tone="danger">{t('watch.live')}</Badge> : <Badge>{t('watch.ended')}</Badge>}
              {played ? t('watch.replay.title') : t('watch.spectating')}
            </p>
            <GameSummary settings={match.settings} moveCount={match.game.moveCount} />
          </>
        }
      >
        {playing ? <LiveBoard match={match} /> : <ReplayBoard match={match} />}
      </GameLayout>
    </>
  );
}
