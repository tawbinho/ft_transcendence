import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { ChatIcon, PlayIcon, SlidersIcon } from '@/components/icons';
import { buttonClass } from '@/components/ui';
import { BlockButton } from '@/features/chat/components/BlockButton';
import { FriendActions } from '@/features/users/components/FriendActions';
import type { Profile } from '@/features/users/types';

/**
 * What the viewer can do on this profile. On their own it is "Edit profile".
 * On a blocked player's it is nothing: the page shows an "Unblock" notice instead.
 */
export function ProfileActions({ player }: { player: Profile }) {
  const { t } = useTranslation();

  if (player.friendship === 'self') {
    return (
      <Link to={paths.settings()} className={buttonClass({ variant: 'secondary' })}>
        <SlidersIcon />
        {t('profile.edit')}
      </Link>
    );
  }
  if (player.blocked) return null;

  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2">
        <Link to={paths.chat(player.displayName)} className={buttonClass({ variant: 'secondary' })}>
          <ChatIcon />
          {t('profile.message')}
        </Link>
        <Link to={paths.challenge(player)} className={buttonClass({ variant: 'secondary' })}>
          <PlayIcon />
          {t('profile.challenge')}
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        <FriendActions player={player} friendship={player.friendship} />
        <BlockButton player={player} blocked={false} />
      </div>
    </div>
  );
}
