import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { EyeIcon } from '@/components/icons';
import { Badge, buttonClass } from '@/components/ui';
import { DiscIcon } from '@/features/game/components/DiscIcon';
import { toBoardTheme } from '@/features/game/settings';
import { BoardShape } from '@/features/matches/components/BoardShape';
import { useMatchPreview } from '@/features/matches/hooks';
import type { MatchSummary } from '@/features/matches/types';
import { formatRelative } from '@/lib/format';

/** One match being played: who plays, the shape of the board, and a button to follow it. */
export function LiveMatchCard({ match }: { match: MatchSummary }) {
  const { t, i18n } = useTranslation();
  const theme = toBoardTheme(match.settings.theme);
  const yours = match.yourSeat !== null;
  // The list has no positions: the match itself is asked for, to draw where the game stands.
  const position = useMatchPreview(match.id).data?.game.board;
  const names = match.players.map((player) => player.displayName).join(` ${t('online.vs')} `);

  return (
    <article className="flex h-full flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge tone="danger">
          <span
            className="me-1.5 inline-block size-2 rounded-full bg-current motion-safe:animate-pulse"
            aria-hidden="true"
          />
          {t('watch.live')}
        </Badge>
        <span className="text-sm text-muted">
          {t('watch.startedAgo', { when: formatRelative(match.createdAt, i18n.language) })}
        </span>
      </div>

      <h2 className="sr-only">{names}</h2>
      <div className="flex items-center gap-4" aria-hidden="true">
        <BoardShape
          cols={match.settings.cols}
          rows={match.settings.rows}
          theme={theme}
          board={position}
          className="h-16"
        />
        <ul className="flex min-w-0 flex-1 flex-col gap-2">
          {match.players.map((player) => (
            <li key={player.seat} className="flex min-w-0 items-center gap-2 font-semibold">
              <DiscIcon seat={player.seat} theme={theme} className="text-xl" />
              <span className="truncate">{player.displayName}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-sm text-muted">
        <span dir="ltr">{t('game.size', { cols: match.settings.cols, rows: match.settings.rows })}</span> ·{' '}
        {t('game.connect', { n: match.settings.winLength })} · {t('watch.movesPlayed', { count: match.moveCount })}
      </p>

      <Link
        to={yours ? paths.match(match.id) : paths.watch(match.id)}
        className={buttonClass({ variant: yours ? 'primary' : 'secondary', className: 'mt-auto' })}
      >
        <EyeIcon />
        {yours ? (
          t('watch.yourMatch')
        ) : (
          <>
            <span aria-hidden="true">{t('watch.watch')}</span>
            {/* Screen readers also hear who plays, so the cards can be told apart. */}
            <span className="sr-only">{t('watch.watchMatch', { names })}</span>
          </>
        )}
      </Link>
    </article>
  );
}
