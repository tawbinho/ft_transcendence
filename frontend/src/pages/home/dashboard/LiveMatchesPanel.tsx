import { useTranslation } from 'react-i18next';
import { LoadError } from '@/components/LoadError';
import { useLiveMatches } from '@/features/spectate/hooks';
import { Panel, PanelSkeleton } from './Panel';

/** How many matches are being played right now, with a link to watch them. */
export function LiveMatchesPanel() {
  const { t } = useTranslation();
  const { data, isPending, error, refetch, isRefetching } = useLiveMatches(1);

  return (
    <Panel title={t('home.live.title')} action={{ to: '/watch', label: t('home.live.watch') }}>
      {isPending ? (
        <PanelSkeleton />
      ) : error ? (
        <LoadError error={error} onRetry={() => void refetch()} retrying={isRefetching} />
      ) : (
        <p className="text-muted">
          {data.total === 0 ? t('home.live.none') : t('home.live.count', { count: data.total })}
        </p>
      )}
    </Panel>
  );
}
