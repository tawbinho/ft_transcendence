import { useTranslation } from 'react-i18next';
import { LoadError } from '@/components/LoadError';
import { Card, EmptyState, Skeleton } from '@/components/ui';
import { BlockButton } from '@/features/chat/components/BlockButton';
import { useBlocks } from '@/features/chat/hooks';
import { PlayerLink } from '@/features/users/components/PlayerLink';

/** The players you blocked, each with an Unblock button. */
export function BlockedSection() {
  const { t } = useTranslation();
  const blocks = useBlocks();

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="text-lg font-bold">{t('account.blockedTitle')}</h2>
      <p className="text-muted">{t('account.blockedBody')}</p>
      {blocks.isPending ? (
        <Skeleton className="h-14" />
      ) : blocks.error ? (
        <LoadError error={blocks.error} onRetry={() => void blocks.refetch()} retrying={blocks.isFetching} />
      ) : blocks.data.length === 0 ? (
        <EmptyState plain>{t('account.blockedEmpty')}</EmptyState>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {blocks.data.map((player) => (
            <li key={player.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <PlayerLink user={player} size="md" />
              <BlockButton player={player} blocked size="sm" variant="secondary" />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
