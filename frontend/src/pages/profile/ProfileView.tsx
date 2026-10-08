import { useTranslation } from 'react-i18next';
import { Alert } from '@/components/ui';
import { BlockButton } from '@/features/chat/components/BlockButton';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
import type { Profile } from '@/features/users/types';
import { Achievements } from './Achievements';
import { ProfileActions } from './ProfileActions';
import { ProfileHeader } from './ProfileHeader';
import { ProfileStats } from './ProfileStats';
import { RecentMatches } from './RecentMatches';

/** A loaded profile: who they are, what they can do with you, their results and their matches. */
export function ProfileView({ player }: { player: Profile }) {
  const { t } = useTranslation();
  useDocumentTitle(player.displayName);

  return (
    <div className="flex flex-col gap-8">
      <ProfileHeader player={player} actions={<ProfileActions player={player} />} />

      {player.blocked && (
        <Alert
          tone="warning"
          title={t('block.blockedTitle')}
          action={<BlockButton player={player} blocked size="sm" variant="secondary" />}
        >
          {t('block.blockedBody')}
        </Alert>
      )}

      <ProfileStats stats={player.stats} />
      <Achievements stats={player.stats} />

      <section aria-labelledby="profile-matches" className="flex flex-col gap-4">
        <h2 id="profile-matches" className="text-xl font-bold">
          {t('profile.matchesTitle')}
        </h2>
        <RecentMatches player={player} />
      </section>
    </div>
  );
}
