import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar, Skeleton } from '@/components/ui';
import { useFriends } from '@/features/friends/hooks';
import { cn } from '@/lib/cn';

/** Quick picks: the friends who are online now. Choosing one fills in the opponent's name. */
export function FriendPicks({ selected, onPick }: { selected: string; onPick: (displayName: string) => void }) {
  const { t } = useTranslation();
  const labelId = useId();
  const friends = useFriends();

  const online = friends.data?.friends.filter((friend) => friend.online) ?? [];

  let content;
  if (friends.isPending) {
    content = <Skeleton className="h-10 w-48" />;
  } else if (friends.isError) {
    content = <p className="text-sm text-muted">{t('online.friendsError')}</p>;
  } else if (online.length === 0) {
    content = <p className="text-sm text-muted">{t('online.friendsNone')}</p>;
  } else {
    content = (
      <ul className="flex flex-wrap gap-2">
        {online.map((friend) => (
          <li key={friend.id}>
            <button
              type="button"
              aria-pressed={selected === friend.displayName}
              aria-label={t('online.invite', { name: friend.displayName })}
              onClick={() => onPick(friend.displayName)}
              className={cn(
                'flex h-10 items-center gap-2 rounded-full border ps-1.5 pe-4 font-semibold transition',
                selected === friend.displayName
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-surface hover:bg-surface-2',
              )}
            >
              <Avatar user={friend} size="sm" presence />
              {friend.displayName}
            </button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div role="group" aria-labelledby={labelId} className="flex flex-col gap-2">
      <p id={labelId} className="text-sm font-semibold">
        {t('online.friendsOnline')}
      </p>
      {content}
    </div>
  );
}
