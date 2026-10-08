import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { ChatIcon } from '@/components/icons';
import { PageHeader } from '@/components/PageHeader';
import { ChatThread } from '@/features/chat/components/ChatThread';
import { ConversationList } from '@/features/chat/components/ConversationList';
import { cn } from '@/lib/cn';

/**
 * /chat lists the conversations; /chat/:displayName opens one. On large
 * screens both show side by side; on small ones, one at a time.
 */
export function ChatPage() {
  const { t } = useTranslation();
  const { displayName } = useParams();

  return (
    <>
      <PageHeader title={t('chat.title')} className={cn('mb-6', displayName && 'max-lg:sr-only')} />
      <div className="grid items-start gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <div className={cn('rounded-2xl border border-border bg-surface p-2', displayName && 'max-lg:hidden')}>
          <ConversationList activeName={displayName} />
        </div>
        <div className={cn(!displayName && 'max-lg:hidden')}>
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
