import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui';
import { FriendActions } from '@/features/users/components/FriendActions';
import { PlayerLink } from '@/features/users/components/PlayerLink';
import type { PlayerListItem } from '@/features/users/types';

/** One player of the search: name, record, and the friend buttons that fit. */
export function PlayerCard({ player }: { player: PlayerListItem }) {
  const { t } = useTranslation();
  const { wins, losses, draws } = player.stats;

  return (
    <li className="flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <PlayerLink user={player} size="md" presence note={t('players.record', { wins, losses, draws })} />
        {player.friendship === 'self' && <Badge tone="info">{t('profile.you')}</Badge>}
        {player.friendship === 'friends' && <Badge tone="success">{t('friends.friend')}</Badge>}
      </div>
      {player.friendship !== 'self' && player.friendship !== 'friends' && (
        <FriendActions player={player} friendship={player.friendship} size="sm" />
      )}
    </li>
  );
}
