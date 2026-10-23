import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { LoadError } from '@/components/LoadError';
import { buttonClass } from '@/components/ui';
import { useFriends } from '@/features/friends/hooks';
import { PlayerLink } from '@/features/users/components/PlayerLink';
import { onlineFriends } from './dashboard';
import { Panel, PanelSkeleton } from './Panel';

/** Friends who are online now, each with a link to challenge them. */
export function FriendsOnlinePanel() {
  const { t } = useTranslation();
  const { data, isPending, error, refetch, isRefetching } = useFriends();
  const online = onlineFriends(data?.friends ?? []);

  return (
    <Panel title={t('home.friendsOnline.title')} action={{ to: '/friends', label: t('home.friendsOnline.all') }}>
      {isPending ? (
        <PanelSkeleton />
      ) : error ? (
        <LoadError error={error} onRetry={() => void refetch()} retrying={isRefetching} />
      ) : online.length === 0 ? (
        <p className="text-muted">
          {data.friends.length === 0 ? t('home.friendsOnline.noFriends') : t('home.friendsOnline.empty')}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {online.map((friend) => (
            <li key={friend.id} className="flex items-center justify-between gap-3">
              <PlayerLink user={friend} presence className="flex-1" />
              <Link
                to={paths.challenge(friend)}
                aria-label={t('home.friendsOnline.challengeName', { name: friend.displayName })}
                className={buttonClass({ variant: 'secondary', size: 'sm', className: 'flex-none' })}
              >
                {t('home.friendsOnline.challenge')}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
