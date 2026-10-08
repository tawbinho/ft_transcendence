import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';

/** The ranking of players. Only the page exists for now; the list comes later. */
export function LeaderboardPage() {
  const { t } = useTranslation();
  return <PageHeader title={t('leaderboard.title')} subtitle={t('leaderboard.soon')} />;
}
