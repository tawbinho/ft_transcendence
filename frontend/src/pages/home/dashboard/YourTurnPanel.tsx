import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { LoadError } from '@/components/LoadError';
import { ChevronRightIcon } from '@/components/icons';
import { Badge } from '@/components/ui';
import { useMatchList } from '@/features/matches/hooks';
import { opponentOf } from '@/features/matches/model';
import { matchesWaitingForMe } from './dashboard';
import { Panel, PanelSkeleton } from './Panel';

/** The online matches where it is the member's move: the reason to come back. */
export function YourTurnPanel() {
  const { t } = useTranslation();
  const { data, isPending, error, refetch, isRefetching } = useMatchList({ status: 'in_progress', limit: 20 });
  const waiting = matchesWaitingForMe(data?.items ?? []);
  const others = (data?.items.length ?? 0) - waiting.length;

  return (
    <Panel title={t('home.yourTurn.title')} action={{ to: '/matches', label: t('home.yourTurn.all') }}>
      {isPending ? (
        <PanelSkeleton />
      ) : error ? (
        <LoadError error={error} onRetry={() => void refetch()} retrying={isRefetching} />
      ) : waiting.length === 0 ? (
        <p className="text-muted">
          {t('home.yourTurn.empty')}
          {others > 0 && ` ${t('home.yourTurn.others', { count: others })}`}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {waiting.map((match) => (
            <li key={match.id}>
              <Link
                to={paths.match(match.id)}
                className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 transition hover:bg-surface-2"
              >
                <span className="min-w-0 flex-1 truncate font-semibold">
                  {t('home.yourTurn.versus', { name: opponentOf(match)?.displayName ?? '?' })}
                </span>
                <Badge tone="info">{t('home.yourTurn.move')}</Badge>
                <ChevronRightIcon className="flex-none text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
