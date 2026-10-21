import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { LoadError } from '@/components/LoadError';
import { PageHeader } from '@/components/PageHeader';
import { PageSpinner } from '@/components/ui';
import { useFriends } from '@/features/friends/hooks';
import { CommunityTabs } from './CommunityTabs';
import { FriendList } from './friends/FriendList';
import { FriendRequests, SentRequests } from './friends/FriendRequests';

/** Friends, the requests waiting for an answer and the requests sent. Blocked players are in the settings. */
export function FriendsPage() {
  const { t } = useTranslation();
  const friends = useFriends();

  return (
    <>
      <PageHeader title={t('friends.title')} subtitle={t('friends.subtitle')} className="mb-4" />
      <CommunityTabs />

      {friends.isPending ? (
        <PageSpinner />
      ) : friends.error ? (
        <LoadError error={friends.error} onRetry={() => void friends.refetch()} retrying={friends.isFetching} />
      ) : (
        <div className="flex flex-col gap-10">
          <FriendRequests requests={friends.data.incoming} />
          <FriendList friends={friends.data.friends} />
          <SentRequests requests={friends.data.outgoing} />
          <p className="text-sm text-muted">
            {t('friends.blockedHint')}{' '}
            <Link to={paths.settings('blocked')} className="font-semibold text-primary hover:underline">
              {t('friends.manageBlocked')}
            </Link>
          </p>
        </div>
      )}
    </>
  );
}
