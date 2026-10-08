import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { CrownIcon } from '@/components/icons';
import { Badge } from '@/components/ui';
import { TournamentStatusBadge } from '@/features/tournaments/components/TournamentStatusBadge';
import type { TournamentSummary } from '@/features/tournaments/types';

/** One line of the list: name, status, size, rules and, once finished, the winner. */
export function TournamentRow({ tournament }: { tournament: TournamentSummary }) {
  const { t } = useTranslation();
  return (
    <Link
      to={paths.tournament(tournament.id)}
      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 transition hover:bg-surface-2"
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate font-semibold">{tournament.name}</span>
        {tournament.joined && <Badge tone="info">{t('tournaments.joined')}</Badge>}
      </span>
      <span className="justify-self-end">
        <TournamentStatusBadge status={tournament.status} />
      </span>
      <span className="min-w-0 text-sm text-muted">
        {t('tournaments.playerCount', { count: tournament.playerCount, size: tournament.size })} ·{' '}
        {t('game.size', { cols: tournament.settings.cols, rows: tournament.settings.rows })} ·{' '}
        {t('game.connect', { n: tournament.settings.winLength })}
      </span>
      <span className="flex min-w-0 items-center justify-end gap-1 text-sm text-muted">
        {tournament.winner && (
          <>
            <CrownIcon className="flex-none text-warning" />
            <span className="sr-only">{t('tournaments.winner')}:</span>
            <span className="truncate font-semibold text-fg">{tournament.winner.displayName}</span>
          </>
        )}
      </span>
    </Link>
  );
}
