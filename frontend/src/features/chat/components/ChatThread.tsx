import { Fragment, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import { paths } from '@/app/paths';
import { BackIcon, PlayIcon } from '@/components/icons';
import { LoadError } from '@/components/LoadError';
import { Alert, Button, EmptyState, Spinner } from '@/components/ui';
import { useUser } from '@/features/auth/hooks';
import { DEFAULT_BOARD_SETTINGS } from '@/features/game/settings';
import { useCreateMatch } from '@/features/matches/hooks';
import { PlayerLink } from '@/features/users/components/PlayerLink';
import { PresenceText } from '@/features/users/components/PresenceText';
import { useProfile } from '@/features/users/hooks';
import type { Profile } from '@/features/users/types';
import { isApiError } from '@/lib/api/errors';
import { useErrorMessage } from '@/lib/errorMessage';
import { formatDate } from '@/lib/format';
import { flattenMessages, useMarkRead, useMessages, usePeerTyping, useSendMessage } from '../hooks';
import type { Message } from '../types';
import { BlockButton } from './BlockButton';
import { Composer } from './Composer';
import { MessageItem } from './MessageItem';

/** Closer than this to the bottom, new messages keep the view scrolled down. */
const STICK_TO_BOTTOM_PX = 80;

/** The conversation with one player, found by display name (as in the URL). */
export function ChatThread({ displayName }: { displayName: string }) {
  const { t } = useTranslation();
  const profile = useProfile(displayName);

  if (profile.isPending) {
    return (
      <p role="status" className="flex items-center justify-center gap-3 p-10 text-muted">
        <Spinner />
        {t('common.loading')}
      </p>
    );
  }
  if (!profile.data) {
    if (isApiError(profile.error, 'USER_NOT_FOUND')) {
      return <EmptyState className="m-4">{t('profile.notFoundBody', { name: displayName })}</EmptyState>;
    }
    return (
      <LoadError
        className="m-4"
        error={profile.error}
        onRetry={() => void profile.refetch()}
        retrying={profile.isFetching}
      />
    );
  }
  if (profile.data.friendship === 'self') return <EmptyState className="m-4">{t('chat.notYourself')}</EmptyState>;
  return <Conversation peer={profile.data} />;
}

function Conversation({ peer }: { peer: Profile }) {
  const { t, i18n } = useTranslation();
  const viewer = useUser();
  const messages = useMessages(peer.id);
  const typing = usePeerTyping(peer.id);

  const items = flattenMessages(messages.data);
  const peerReadAt = messages.data?.pages[0]?.peerReadAt ?? null;
  const latestFromPeer = items.findLast((message) => message.senderId === peer.id) ?? null;
  const latestMine = items.findLast((message) => message.senderId === viewer?.id) ?? null;
  useMarkRead(peer.id, latestFromPeer?.id ?? null);

  // Scrolling: new messages scroll into view if the reader was at the bottom
  // (or wrote them); older messages loaded at the top keep the view still.
  const scroller = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const distanceFromBottom = useRef<number | null>(null);
  const firstId = items[0]?.id;
  const lastId = items[items.length - 1]?.id;
  const lastIsMine = items[items.length - 1]?.senderId === viewer?.id;

  useLayoutEffect(() => {
    const element = scroller.current;
    if (element && (atBottom.current || lastIsMine)) element.scrollTop = element.scrollHeight;
  }, [lastId, lastIsMine, typing]);

  useLayoutEffect(() => {
    const element = scroller.current;
    if (!element || distanceFromBottom.current === null) return;
    element.scrollTop = element.scrollHeight - distanceFromBottom.current;
    distanceFromBottom.current = null;
  }, [firstId]);

  function loadOlder() {
    const element = scroller.current;
    if (element) distanceFromBottom.current = element.scrollHeight - element.scrollTop;
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
    <div className="flex h-[min(44rem,calc(100dvh-13rem))] min-h-[24rem] flex-col overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-3 py-3 sm:px-4">
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
        onScroll={(event) => {
          const element = event.currentTarget;
          atBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < STICK_TO_BOTTOM_PX;
        }}
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

/** Creates a match reserved for the peer and sends them the invitation. */
function InviteButton({ peer }: { peer: Profile }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const errorMessage = useErrorMessage();
  const create = useCreateMatch();
  const send = useSendMessage(peer.id);
  const error = create.error ?? send.error;

  function invite() {
    create.mutate(
      { settings: DEFAULT_BOARD_SETTINGS, opponentDisplayName: peer.displayName },
      {
        onSuccess: (match) =>
          send.mutate({ matchId: match.id }, { onSuccess: () => void navigate(paths.match(match.id)) }),
      },
    );
  }

  return (
    <>
      <Button size="sm" variant="secondary" loading={create.isPending || send.isPending} onClick={invite}>
        <PlayIcon />
        {t('chat.invite')}
      </Button>
      {error && (
        <Alert tone="danger" className="basis-full">
          {errorMessage(error)}
        </Alert>
      )}
    </>
  );
}
