import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { Alert, Button, Card, PageSpinner } from '@/components/ui';
import { ProfileEditor } from '@/features/account/ProfileEditor';
import { TwoFactorPanel } from '@/features/account/TwoFactorPanel';
import { useLogout, useUser } from '@/features/auth/hooks';
import { ColorSchemeSelect } from '@/layout/ColorSchemeSelect';
import { LanguageSelect } from '@/layout/LanguageSelect';
import { useErrorMessage } from '@/lib/errorMessage';

export function AccountPage() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const user = useUser();
  const logout = useLogout();

  if (!user) return <PageSpinner />;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader title={t('account.title')} className="mb-2" />

      <ProfileEditor user={user} />

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">{t('account.preferences')}</h2>
        <div className="flex flex-wrap gap-6">
          <LanguageSelect showLabel />
          <ColorSchemeSelect showLabel />
        </div>
      </Card>

      <TwoFactorPanel user={user} />

      <Card className="flex flex-col items-start gap-3">
        <h2 className="text-lg font-bold">{t('account.session')}</h2>
        <p className="text-muted">{t('account.logoutBody')}</p>
        {logout.error && <Alert tone="danger">{errorMessage(logout.error)}</Alert>}
        <Button variant="secondary" loading={logout.isPending} onClick={() => logout.mutate()}>
          {t('nav.logout')}
        </Button>
      </Card>
    </div>
  );
}
