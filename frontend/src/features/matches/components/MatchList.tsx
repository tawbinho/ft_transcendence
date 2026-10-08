import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { Badge, type BadgeTone } from '@/components/ui';
import { formatDateTime } from '@/lib/format';
import { opponentOf, outcomeOf } from '../model';
import type { MatchSummary } from '../types';

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

/** The viewer's matches, one row each, linking to the match page. */
export function MatchList({ matches }: { matches: readonly MatchSummary[] }) {
  const { t, i18n } = useTranslation();

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
      {matches.map((match) => {
        const opponent = opponentOf(match)?.displayName;
        return (
          <li key={match.id}>
            <Link
              to={paths.match(match.id)}
              aria-label={opponent ? t('history.open', { name: opponent }) : t('history.noOpponent')}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 transition hover:bg-surface-2 sm:grid-cols-[minmax(0,1fr)_8rem_10rem_6.5rem]"
            >
              <span className="truncate font-semibold">
                {opponent ?? <span className="text-muted">{t('history.noOpponent')}</span>}
              </span>
              <span className="justify-self-end sm:order-last">
                <StatusBadge match={match} />
              </span>
              <span className="text-sm text-muted">
                {t('game.size', { cols: match.settings.cols, rows: match.settings.rows })} ·{' '}
                {t('game.connect', { n: match.settings.winLength })}
              </span>
              <span className="text-end text-sm text-muted sm:text-start">
                <time dateTime={match.createdAt}>{formatDateTime(match.createdAt, i18n.language)}</time>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
