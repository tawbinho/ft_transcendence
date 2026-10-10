import { useTranslation } from 'react-i18next';
import { Navigate, useParams } from 'react-router';
import { paths } from '@/app/paths';
import { PageHeader } from '@/components/PageHeader';
import { PageSpinner, TabLinks, type TabLink } from '@/components/ui';
import { useUser } from '@/features/auth/hooks';
import { BlockedSection } from './sections/BlockedSection';
import { PreferencesSection } from './sections/PreferencesSection';
import { ProfileSection } from './sections/ProfileSection';
import { SecuritySection } from './sections/SecuritySection';
import { resolveSection } from './sections';

/** /settings/:section?. A row of tabs, then the section the address names. */
export function SettingsPage() {
  const { t } = useTranslation();
  const { section: param } = useParams();
  const user = useUser();
  const { section, canonical } = resolveSection(param);

  if (!canonical) return <Navigate to={paths.settings()} replace />;
  if (!user) return <PageSpinner />;

  const tabs: TabLink[] = [
    // The profile section is the start of the others' address, so only an exact match marks it.
    { to: paths.settings(), label: t('account.tabProfile'), end: true },
    { to: paths.settings('security'), label: t('account.tabSecurity') },
    { to: paths.settings('preferences'), label: t('account.tabPreferences') },
    { to: paths.settings('blocked'), label: t('account.tabBlocked') },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('account.title')} subtitle={t('account.subtitle')} className="mb-0" />
      <TabLinks label={t('account.sections')} tabs={tabs} />
      {/* Forms are narrower than the page, but start at the same left edge as the title (see AppLayout). */}
      <div className="flex max-w-3xl flex-col gap-6">
        {section === 'profile' && <ProfileSection user={user} />}
        {section === 'security' && <SecuritySection user={user} />}
        {section === 'preferences' && <PreferencesSection />}
        {section === 'blocked' && <BlockedSection />}
      </div>
    </div>
  );
}
