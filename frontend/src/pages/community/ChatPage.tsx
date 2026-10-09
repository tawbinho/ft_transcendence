import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { ChatIcon } from '@/components/icons';
import { PageHeader } from '@/components/PageHeader';
import { ChatThread } from '@/features/chat/components/ChatThread';
import { ConversationList } from '@/features/chat/components/ConversationList';
import { phonePane } from '@/features/chat/panes';
import { cn } from '@/lib/cn';

/**
 * /chat lists the conversations; /chat/:displayName opens one. On large
 * screens both show side by side; on a phone, one at a time (see phonePane).
 */
export function ChatPage() {
  const { t } = useTranslation();
  const { displayName } = useParams();
  const pane = phonePane(displayName);

  return (
    <>
      <PageHeader title={t('chat.title')} className={cn('mb-6', pane === 'conversation' && 'max-lg:sr-only')} />
      {/* minmax(0, 1fr): without it the single phone column grows to fit a long message preview and the page scrolls sideways. */}
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <div
          className={cn(
            'min-w-0 rounded-2xl border border-border bg-surface p-2',
            pane === 'conversation' && 'max-lg:hidden',
          )}
        >
          <ConversationList activeName={displayName} />
        </div>
        <div className={cn('min-w-0', pane === 'list' && 'max-lg:hidden')}>
          {displayName ? (
            <ChatThread key={displayName} displayName={displayName} />
          ) : (
            <div className="flex h-[min(44rem,calc(100dvh-13rem))] min-h-[24rem] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border p-8 text-center text-muted">
              <ChatIcon className="text-4xl" />
              <p>{t('chat.pickConversation')}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
