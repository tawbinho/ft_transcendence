import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { LoadError } from '@/components/LoadError';
import { Avatar, buttonClass, EmptyState, Spinner } from '@/components/ui';
import { useUser } from '@/features/auth/hooks';
import { cn } from '@/lib/cn';
import { formatMessageTime } from '@/lib/format';
import { useConversations } from '../hooks';
import type { Conversation, Message } from '../types';

/** The viewer's conversations, most recent first, with unread counts. */
export function ConversationList({ activeName }: { activeName?: string }) {
  const { t } = useTranslation();
  const conversations = useConversations();

  if (conversations.isPending) {
    return (
      <p role="status" className="flex items-center gap-3 p-4 text-muted">
        <Spinner />
        {t('common.loading')}
      </p>
    );
  }
  if (conversations.error) {
    return (
      <LoadError
        error={conversations.error}
        onRetry={() => void conversations.refetch()}
        retrying={conversations.isFetching}
      />
    );
  }
  if (conversations.data.length === 0) {
    return (
      <EmptyState
        action={
          <Link to="/friends" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
            {t('nav.friends')}
          </Link>
        }
      >
        {t('chat.noConversations')}
      </EmptyState>
    );
  }

  return (
    <nav aria-label={t('chat.conversations')}>
      <ul className="flex flex-col gap-1">
        {conversations.data.map((conversation) => (
          <li key={conversation.peer.id}>
            <ConversationLink conversation={conversation} active={conversation.peer.displayName === activeName} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function ConversationLink({ conversation, active }: { conversation: Conversation; active: boolean }) {
  const { t, i18n } = useTranslation();
  const viewer = useUser();
  const { peer, lastMessage, unread } = conversation;

  return (
    <Link
      to={paths.chat(peer.displayName)}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-2.5 transition',
        active ? 'bg-primary/12' : 'hover:bg-surface-2',
      )}
    >
      <Avatar user={peer} presence />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate font-semibold">{peer.displayName}</span>
          {lastMessage && (
            <time dateTime={lastMessage.createdAt} className="flex-none text-xs text-muted">
              {formatMessageTime(lastMessage.createdAt, i18n.language)}
            </time>
          )}
        </span>
        {/* dir="auto": the line takes the direction of its text, so it is cut at the right end. */}
        <span dir="auto" className={cn('block truncate text-sm', unread > 0 ? 'font-semibold text-fg' : 'text-muted')}>
          {conversation.blocked
            ? t('block.blockedShort')
            : lastMessage && <Preview message={lastMessage} mine={lastMessage.senderId === viewer?.id} />}
        </span>
      </span>
      {unread > 0 && (
        <>
          <span
            aria-hidden="true"
            className="grid h-5 min-w-5 flex-none place-items-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-fg"
          >
            {unread > 99 ? '99+' : unread}
          </span>
          <span className="sr-only">{t('chat.unreadCount', { count: unread })}</span>
        </>
      )}
    </Link>
  );
}

/** The last message of a conversation, in one line. */
function Preview({ message, mine }: { message: Message; mine: boolean }) {
  const { t } = useTranslation();
  if (message.kind === 'invite') return mine ? t('chat.inviteSentPreview') : t('chat.inviteReceivedPreview');
  if (message.kind === 'system') return t('chat.tournamentMatchPreview');
  if (!mine) return message.body;
  // <bdi>: the message keeps its own direction after the label (English in the Arabic page, say).
  return (
    <>
      {t('chat.youLabel')} <bdi>{message.body}</bdi>
    </>
  );
}
