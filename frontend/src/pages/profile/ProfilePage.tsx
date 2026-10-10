import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { LoadError } from '@/components/LoadError';
import { PageHeader } from '@/components/PageHeader';
import { buttonClass, Card, PageSpinner } from '@/components/ui';
import { useProfile } from '@/features/users/hooks';
import { isApiError } from '@/lib/api/errors';
import { ProfileView } from './ProfileView';

/** /users/:displayName. This file only loads the profile; ProfileView shows it. */
export function ProfilePage() {
  const { displayName = '' } = useParams();
  // The key makes a new page state for each player, so one profile never shows another's matches page.
  return <ProfileScreen key={displayName} displayName={displayName} />;
}

function ProfileScreen({ displayName }: { displayName: string }) {
  const { t } = useTranslation();
  const profile = useProfile(displayName);

  if (profile.isPending) return <PageSpinner />;
  if (!profile.data) {
    if (isApiError(profile.error, 'USER_NOT_FOUND')) {
      return (
        <div className="mx-auto max-w-lg">
          <PageHeader title={t('profile.notFoundTitle')} />
          <Card className="flex flex-col items-start gap-4">
            <p className="text-muted">{t('profile.notFoundBody', { name: displayName })}</p>
            <Link to="/players" className={buttonClass()}>
              {t('players.findPlayers')}
            </Link>
          </Card>
        </div>
      );
    }
    return <LoadError error={profile.error} onRetry={() => void profile.refetch()} retrying={profile.isFetching} />;
  }

  return <ProfileView player={profile.data} />;
}
