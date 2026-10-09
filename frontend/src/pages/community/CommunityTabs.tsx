import { useTranslation } from 'react-i18next';
import { TabLinks } from '@/components/ui';
import { useIncomingRequestCount } from '@/features/friends/hooks';

/** The three pages of the community area, one click apart. Friends shows how many requests wait. */
export function CommunityTabs() {
  const { t } = useTranslation();
  const requests = useIncomingRequestCount(true);

  return (
    <TabLinks
      label={t('community.tabsLabel')}
      className="mb-6"
      tabs={[
        { to: '/players', label: t('players.title') },
        { to: '/leaderboard', label: t('leaderboard.title') },
        { to: '/friends', label: t('friends.title'), count: requests },
      ]}
    />
  );
}
