import { useTranslation } from 'react-i18next';
import { LoadError } from '@/components/LoadError';
import { EmptyState, Spinner } from '@/components/ui';
import { useProfile } from '@/features/users/hooks';
import { isApiError } from '@/lib/api/errors';
import { Conversation } from './Conversation';

/** The conversation with one player, found by display name (as in the URL). It looks the player up first. */
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
