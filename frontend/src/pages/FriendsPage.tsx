import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { ChatIcon, PlayIcon, SearchIcon } from '@/components/icons';
import { LoadError } from '@/components/LoadError';
import { PageHeader } from '@/components/PageHeader';
import { buttonClass, EmptyState, PageSpinner } from '@/components/ui';
import { BlockButton } from '@/features/chat/components/BlockButton';
import { useBlocks } from '@/features/chat/hooks';
import { useFriends } from '@/features/friends/hooks';
import { FriendActions } from '@/features/users/components/FriendActions';
import { PlayerLink } from '@/features/users/components/PlayerLink';
import { PresenceText } from '@/features/users/components/PresenceText';

export function FriendsPage() {
  const { t } = useTranslation();
  const friends = useFriends();

  return (
    <>
      <PageHeader
        title={t('friends.title')}
        subtitle={t('friends.subtitle')}
        actions={
          <Link to="/players" className={buttonClass({ variant: 'secondary' })}>
            <SearchIcon />
            {t('players.findPlayers')}
          </Link>
        }
      />

      {friends.isPending ? (
        <PageSpinner />
      ) : friends.error ? (
        <LoadError error={friends.error} onRetry={() => void friends.refetch()} retrying={friends.isFetching} />
      ) : (
        <div className="flex flex-col gap-10">
          {friends.data.incoming.length > 0 && (
            <Section id="friend-requests" title={t('friends.requests')}>
              <PeopleList>
                {friends.data.incoming.map((player) => (
                  <Row key={player.id}>
                    <PlayerLink user={player} size="md" presence note={t('friends.wantsToBeFriends')} />
                    <FriendActions player={player} friendship="request_received" size="sm" />
                  </Row>
                ))}
              </PeopleList>
            </Section>
          )}

          <Section id="friend-list" title={t('friends.listTitle')}>
            {friends.data.friends.length === 0 ? (
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
                {friends.data.friends.map((friend) => (
                  <Row key={friend.id}>
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
                  </Row>
                ))}
              </PeopleList>
            )}
          </Section>

          {friends.data.outgoing.length > 0 && (
            <Section id="sent-requests" title={t('friends.sentRequests')}>
              <PeopleList>
                {friends.data.outgoing.map((player) => (
                  <Row key={player.id}>
                    <PlayerLink user={player} size="md" note={t('friends.waitingForAnswer')} />
                    <FriendActions player={player} friendship="request_sent" size="sm" />
                  </Row>
                ))}
              </PeopleList>
            </Section>
          )}

          <BlockedPlayers />
        </div>
      )}
    </>
  );
}

/** Players the viewer blocked; hidden when there are none. */
function BlockedPlayers() {
  const { t } = useTranslation();
  const blocks = useBlocks();
  if (blocks.error) {
    return <LoadError error={blocks.error} onRetry={() => void blocks.refetch()} retrying={blocks.isFetching} />;
  }
  if (!blocks.data || blocks.data.length === 0) return null;

  return (
    <Section id="blocked-players" title={t('block.listTitle')}>
      <PeopleList>
        {blocks.data.map((player) => (
          <Row key={player.id}>
            <PlayerLink user={player} size="md" />
            <BlockButton player={player} blocked size="sm" variant="secondary" />
          </Row>
        ))}
      </PeopleList>
    </Section>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <h2 id={id} className="text-xl font-bold">
        {title}
      </h2>
      {children}
    </section>
  );
}

function PeopleList({ children }: { children: ReactNode }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">{children}</ul>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">{children}</li>;
}
