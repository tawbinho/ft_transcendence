import { useTranslation } from 'react-i18next';
import { LoadError } from '@/components/LoadError';
import { MatchList } from '@/features/matches/components/MatchList';
import { useMatchList } from '@/features/matches/hooks';
import { Panel, PanelSkeleton } from './Panel';

/** The last five finished matches, each linking to its page. */
export function RecentResultsPanel() {
  const { t } = useTranslation();
  const { data, isPending, error, refetch, isRefetching } = useMatchList({ status: 'finished', limit: 5 });

  return (
    <Panel title={t('home.recent.title')} action={{ to: '/matches', label: t('home.recent.all') }}>
      {isPending ? (
        <PanelSkeleton />
      ) : error ? (
        <LoadError error={error} onRetry={() => void refetch()} retrying={isRefetching} />
      ) : data.items.length === 0 ? (
        <p className="text-muted">{t('home.recent.empty')}</p>
      ) : (
        <MatchList matches={data.items} />
      )}
    </Panel>
  );
}
