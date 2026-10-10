import { Fragment, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { BackIcon } from '@/components/icons';
import { LoadError } from '@/components/LoadError';
import { Alert, Button, Spinner } from '@/components/ui';
import { useUser } from '@/features/auth/hooks';
import { PlayerLink } from '@/features/users/components/PlayerLink';
import { PresenceText } from '@/features/users/components/PresenceText';
import type { Profile } from '@/features/users/types';
import { formatDate } from '@/lib/format';
import { flattenMessages, useMarkRead, useMessages, usePeerTyping } from '../hooks';
import type { Message } from '../types';
import { useChatScroll } from '../useChatScroll';
import { BlockButton } from './BlockButton';
import { Composer } from './Composer';
import { InviteButton } from './InviteButton';
import { MessageItem } from './MessageItem';

/** The messages with one player, a header with the actions, and the box to write in. */
export function Conversation({ peer }: { peer: Profile }) {
  const { t, i18n } = useTranslation();
  const viewer = useUser();
  const messages = useMessages(peer.id);
  const typing = usePeerTyping(peer.id);

  const items = flattenMessages(messages.data);
  const peerReadAt = messages.data?.pages[0]?.peerReadAt ?? null;
  const latestFromPeer = items.findLast((message) => message.senderId === peer.id) ?? null;
  const latestMine = items.findLast((message) => message.senderId === viewer?.id) ?? null;
  useMarkRead(peer.id, latestFromPeer?.id ?? null);

  const { scroller, onScroll, rememberPosition } = useChatScroll({
    firstId: items[0]?.id,
    lastId: items[items.length - 1]?.id,
    lastIsMine: items[items.length - 1]?.senderId === viewer?.id,
    typing,
  });

  function loadOlder() {
    rememberPosition();
    void messages.fetchNextPage();
  }

  // Screen readers hear the peer's new messages, not the whole list again.
  const [announcement, setAnnouncement] = useState('');
  const announcedId = useRef<string | null>(null);
  useLayoutEffect(() => {
    if (!latestFromPeer || latestFromPeer.kind !== 'text') return;
    // The first load is not news.
    if (announcedId.current !== null && announcedId.current !== latestFromPeer.id) {
      setAnnouncement(`${peer.displayName}: ${latestFromPeer.body}`);
    }
    announcedId.current = latestFromPeer.id;
  }, [latestFromPeer, peer.displayName]);

  return (
    <div className="flex h-[min(44rem,calc(100dvh-13rem))] min-h-[24rem] min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-3 py-3 sm:px-4">
        {/* Only on a phone: the list and the conversation do not fit side by side. */}
        <Link
          to="/chat"
          className="grid size-9 place-items-center rounded-lg text-xl hover:bg-surface-2 lg:hidden"
          aria-label={t('chat.back')}
        >
          <BackIcon />
        </Link>
        <PlayerLink
          user={peer}
          size="md"
          presence
          note={<PresenceText online={peer.online} lastSeenAt={peer.lastSeenAt} />}
        />
        <div className="ms-auto flex flex-wrap items-center gap-2">
          {!peer.blocked && <InviteButton peer={peer} />}
          <BlockButton player={peer} blocked={peer.blocked} size="sm" />
        </div>
      </div>

      <div
        ref={scroller}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto px-3 py-4 sm:px-4"
        // Focusable so the history can be scrolled with the keyboard.
        tabIndex={0}
        role="region"
        aria-label={t('chat.historyLabel', { name: peer.displayName })}
      >
        {messages.isPending ? (
          <p role="status" className="flex items-center justify-center gap-3 p-6 text-muted">
            <Spinner />
            {t('common.loading')}
          </p>
        ) : messages.error && items.length === 0 ? (
          <LoadError error={messages.error} onRetry={() => void messages.refetch()} retrying={messages.isFetching} />
        ) : (
          <>
            {messages.hasNextPage && (
              <div className="mb-4 flex justify-center">
                <Button size="sm" variant="secondary" loading={messages.isFetchingNextPage} onClick={loadOlder}>
                  {t('chat.loadOlder')}
                </Button>
              </div>
            )}
            {items.length === 0 && (
              <p className="p-6 text-center text-muted">{t('chat.empty', { name: peer.displayName })}</p>
            )}
            <ol className="flex flex-col gap-3">
              {items.map((message, index) => (
                <Fragment key={message.id}>
                  {startsNewDay(items, index) && (
                    <li className="my-2 text-center text-xs font-semibold text-muted" aria-hidden="true">
                      {formatDate(message.createdAt, i18n.language)}
                    </li>
                  )}
                  <MessageItem
                    message={message}
                    mine={message.senderId === viewer?.id}
                    peerName={peer.displayName}
                    seen={message.id === latestMine?.id && peerReadAt !== null && peerReadAt >= message.createdAt}
                  />
                </Fragment>
              ))}
            </ol>
            {typing && (
              <p className="mt-3 flex items-center gap-2 text-sm text-muted">
                <span className="typing-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                {t('chat.typing', { name: peer.displayName })}
              </p>
            )}
          </>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      {peer.blocked ? (
        <Alert tone="warning" className="m-3">
          {t('block.blockedBody')}
        </Alert>
      ) : (
        <Composer peer={peer} />
      )}
    </div>
  );
}

function startsNewDay(messages: Message[], index: number): boolean {
  if (index === 0) return true;
  return (
    new Date(messages[index - 1]!.createdAt).toDateString() !== new Date(messages[index]!.createdAt).toDateString()
  );
}
