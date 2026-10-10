import { useTranslation } from 'react-i18next';
import { FriendActions } from '@/features/users/components/FriendActions';
import { PlayerLink } from '@/features/users/components/PlayerLink';
import type { UserSummary } from '@/features/users/types';
import { PeopleList, PersonRow, Section } from './PeopleList';

/** Requests other players sent to the viewer, with Accept and Decline. Nothing is shown when there are none. */
export function FriendRequests({ requests }: { requests: UserSummary[] }) {
  const { t } = useTranslation();
  if (requests.length === 0) return null;

  return (
    <Section id="friend-requests" title={t('friends.requests')}>
      <PeopleList>
        {requests.map((player) => (
          <PersonRow key={player.id}>
            <PlayerLink user={player} size="md" presence note={t('friends.wantsToBeFriends')} />
            <FriendActions player={player} friendship="request_received" size="sm" />
          </PersonRow>
        ))}
      </PeopleList>
    </Section>
  );
}

/** Requests the viewer sent and nobody answered yet, with Cancel. Nothing is shown when there are none. */
export function SentRequests({ requests }: { requests: UserSummary[] }) {
  const { t } = useTranslation();
  if (requests.length === 0) return null;

  return (
    <Section id="sent-requests" title={t('friends.sentRequests')}>
      <PeopleList>
        {requests.map((player) => (
          <PersonRow key={player.id}>
            <PlayerLink user={player} size="md" note={t('friends.waitingForAnswer')} />
            <FriendActions player={player} friendship="request_sent" size="sm" />
          </PersonRow>
        ))}
      </PeopleList>
    </Section>
  );
}
