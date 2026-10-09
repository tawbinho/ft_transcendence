import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import type { User } from '@/features/auth/types';
import { FriendsOnlinePanel } from './FriendsOnlinePanel';
import { LiveMatchesPanel } from './LiveMatchesPanel';
import { QuickActions } from './QuickActions';
import { RecentResultsPanel } from './RecentResultsPanel';
import { YourTurnPanel } from './YourTurnPanel';
import { greetingOf } from './dashboard';

/** What a member sees: a greeting, buttons to start a game and a few panels about their matches and friends. */
export function Dashboard({ user }: { user: User }) {
  const { t } = useTranslation();
  const greeting = greetingOf(new Date().getHours());

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        className="mb-0"
        title={t(`home.greeting.${greeting}`, { name: user.displayName })}
        subtitle={t('home.dashboardSubtitle')}
      />
      <QuickActions />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-6">
          <YourTurnPanel />
          <RecentResultsPanel />
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <FriendsOnlinePanel />
          <LiveMatchesPanel />
        </div>
      </div>
    </div>
  );
}
