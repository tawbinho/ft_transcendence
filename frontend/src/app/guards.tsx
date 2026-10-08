import { useTranslation } from 'react-i18next';
import { Navigate, Outlet, useLocation, type Location } from 'react-router';
import { Alert, Button, PageSpinner } from '@/components/ui';
import { useCurrentUser } from '@/features/auth/hooks';
import { useErrorMessage } from '@/lib/errorMessage';

/** Where to go back to after logging in (only paths inside the app). */
export function returnPath(location: Location): string | null {
  const from = (location.state as { from?: Partial<Location> } | null)?.from;
  if (!from?.pathname?.startsWith('/') || from.pathname.startsWith('//')) return null;
  return `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`;
}

/** Pages below need a logged-in user; visitors are sent to the login page. */
export function RequireAuth() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const { data: user, isPending, error, refetch, isRefetching } = useCurrentUser();
  const location = useLocation();

  if (isPending) return <PageSpinner />;
  if (user === undefined && error) {
    return (
      <Alert
        tone="danger"
        title={t('errors.title')}
        action={
          <Button size="sm" variant="secondary" loading={isRefetching} onClick={() => void refetch()}>
            {t('common.retry')}
          </Button>
        }
      >
        {errorMessage(error)}
      </Alert>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

/** Login and signup: a logged-in user goes on to where they were heading. */
export function GuestOnly() {
  const { data: user, isPending } = useCurrentUser();
  const location = useLocation();

  if (isPending) return <PageSpinner />;
  if (user) return <Navigate to={returnPath(location) ?? '/play'} replace />;
  return <Outlet />;
}
