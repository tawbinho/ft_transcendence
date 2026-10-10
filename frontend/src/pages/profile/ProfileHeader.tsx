import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar, Badge, Card } from '@/components/ui';
import { levelOf } from '@/features/users/achievements';
import type { Profile } from '@/features/users/types';
import { PresenceText } from '@/features/users/components/PresenceText';
import { formatDate } from '@/lib/format';

/** Picture, name (the page's h1), level, presence and member since. `actions` sits on the other side. */
export function ProfileHeader({ player, actions }: { player: Profile; actions: ReactNode }) {
  const { t, i18n } = useTranslation();
  const { level } = levelOf(player.stats);

  return (
    <Card className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <Avatar user={player} size="xl" presence />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="min-w-0 truncate text-3xl font-extrabold tracking-tight">{player.displayName}</h1>
          {player.friendship === 'self' && <Badge tone="info">{t('profile.you')}</Badge>}
          {player.friendship === 'friends' && <Badge tone="success">{t('friends.friend')}</Badge>}
          <Badge>{t('profile.level', { level })}</Badge>
        </div>
        <p className="mt-1 text-muted">
          <PresenceText online={player.online} lastSeenAt={player.lastSeenAt} />
          <span aria-hidden="true"> · </span>
          {t('profile.memberSince', { date: formatDate(player.createdAt, i18n.language) })}
        </p>
      </div>
      {actions}
    </Card>
  );
}
