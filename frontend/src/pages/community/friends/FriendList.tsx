import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { ChatIcon, PlayIcon } from '@/components/icons';
import { buttonClass, EmptyState } from '@/components/ui';
import type { Friend } from '@/features/friends/types';
import { FriendActions } from '@/features/users/components/FriendActions';
import { PlayerLink } from '@/features/users/components/PlayerLink';
import { PresenceText } from '@/features/users/components/PresenceText';
import { countOnline, onlineFirst } from './friendOrder';
import { PeopleList, PersonRow, Section } from './PeopleList';

/** The viewer's friends, online ones first, each with Message, Challenge and Remove. */
export function FriendList({ friends }: { friends: Friend[] }) {
  const { t } = useTranslation();

  return (
    <Section
      id="friend-list"
      title={t('friends.listTitle')}
      aside={friends.length > 0 ? t('friends.onlineCount', { count: countOnline(friends) }) : undefined}
    >
      {friends.length === 0 ? (
        <EmptyState
          action={
            <Link to="/players" className={buttonClass({ variant: 'secondary' })}>
              {t('players.findPlayers')}
            </Link>
          }
        >
          {t('friends.empty')}
        </EmptyState>
      ) : (
        <PeopleList>
          {onlineFirst(friends).map((friend) => (
            <PersonRow key={friend.id}>
              <PlayerLink user={friend} size="md" presence note={<PresenceText online={friend.online} />} />
              <div className="flex flex-wrap gap-2">
                <Link
                  to={paths.chat(friend.displayName)}
                  className={buttonClass({ variant: 'secondary', size: 'sm' })}
                  aria-label={t('friends.messageName', { name: friend.displayName })}
                >
                  <ChatIcon />
                  {t('profile.message')}
                </Link>
                <Link
                  to={paths.challenge(friend.displayName)}
                  className={buttonClass({ variant: 'secondary', size: 'sm' })}
                  aria-label={t('friends.challengeName', { name: friend.displayName })}
                >
                  <PlayIcon />
                  {t('profile.challenge')}
                </Link>
                <FriendActions player={friend} friendship="friends" size="sm" />
              </div>
            </PersonRow>
          ))}
        </PeopleList>
      )}
    </Section>
  );
}
