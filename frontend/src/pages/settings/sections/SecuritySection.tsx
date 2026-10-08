import { useTranslation } from 'react-i18next';
import { Alert, Button, Card } from '@/components/ui';
import { TwoFactorPanel } from '@/features/account/TwoFactorPanel';
import { useLogout } from '@/features/auth/hooks';
import type { User } from '@/features/auth/types';
import { useErrorMessage } from '@/lib/errorMessage';

/** Two-factor authentication, and who is logged in with a way to log out. */
export function SecuritySection({ user }: { user: User }) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const logout = useLogout();

  return (
    <>
      <TwoFactorPanel user={user} />
      <Card className="flex flex-col items-start gap-3">
        <h2 className="text-lg font-bold">{t('account.session')}</h2>
        <p className="max-w-full break-words text-muted">{t('account.loggedInAs', { email: user.email })}</p>
        <p className="text-muted">{t('account.logoutBody')}</p>
        {logout.error && <Alert tone="danger">{errorMessage(logout.error)}</Alert>}
        <Button variant="secondary" loading={logout.isPending} onClick={() => logout.mutate()}>
          {t('nav.logout')}
        </Button>
      </Card>
    </>
  );
}
