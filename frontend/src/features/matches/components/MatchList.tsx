import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { Badge, type BadgeTone } from '@/components/ui';
import { toBoardTheme } from '@/features/game/settings';
import { formatDateTime } from '@/lib/format';
import { opponentOf, outcomeOf } from '../model';
import type { MatchSummary } from '../types';
import { BoardShape } from './BoardShape';

function StatusBadge({ match }: { match: MatchSummary }) {
  const { t } = useTranslation();
  const outcome = outcomeOf(match);
  const [tone, label]: [BadgeTone, string] =
    outcome === 'won'
      ? ['success', t('history.status.won')]
      : outcome === 'lost'
        ? ['danger', t('history.status.lost')]
        : outcome === 'draw'
          ? ['neutral', t('history.status.draw')]
          : outcome === 'cancelled'
            ? ['neutral', t('history.status.cancelled')]
            : match.status === 'waiting'
              ? ['warning', t('history.status.waiting')]
              : ['info', t('history.status.in_progress')];
  return <Badge tone={tone}>{label}</Badge>;
}

/**
 * The viewer's matches, one row each: the row opens the match page.
 * The list is shown full width (History) and in a narrow card (the home page), so its rows follow
 * the width of the list (`@container` and the `@md:` / `@2xl:` classes), not the width of the screen.
 */
export function MatchList({ matches }: { matches: readonly MatchSummary[] }) {
  const { t, i18n } = useTranslation();

  return (
    <ul className="@container divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
      {matches.map((match) => {
        const opponent = opponentOf(match)?.displayName;
        return (
          // The row's main link covers the whole row (the ::after layer).
          <li key={match.id} className="relative flex items-center gap-3 px-4 py-3 transition hover:bg-surface-2">
            <BoardShape
              cols={match.settings.cols}
              rows={match.settings.rows}
              theme={toBoardTheme(match.settings.theme)}
              className="hidden @md:block"
            />
            <div className="grid min-w-0 flex-1 gap-x-4 gap-y-0.5 @2xl:grid-cols-[minmax(0,1fr)_8rem_10rem]">
              <Link
                to={paths.match(match.id)}
                aria-label={opponent ? t('history.open', { name: opponent }) : t('history.noOpponent')}
                className="truncate font-semibold after:absolute after:inset-0"
              >
                {opponent ?? <span className="text-muted">{t('history.noOpponent')}</span>}
              </Link>
              <span className="text-sm text-muted">
                {/* Numbers keep their order inside right-to-left text (Arabic), so the size reads 7 × 6 and not 6 × 7. */}
                <span dir="ltr">{t('game.size', { cols: match.settings.cols, rows: match.settings.rows })}</span> ·{' '}
                {t('game.connect', { n: match.settings.winLength })}
              </span>
              <time dateTime={match.createdAt} className="text-sm text-muted">
                {formatDateTime(match.createdAt, i18n.language)}
              </time>
            </div>
            <span className="flex-none @md:w-24">
              <StatusBadge match={match} />
            </span>
          </li>
        );
      })}
    </ul>
  );
}
