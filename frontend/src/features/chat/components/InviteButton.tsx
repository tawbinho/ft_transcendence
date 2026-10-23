import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { PlayIcon } from '@/components/icons';
import { buttonClass } from '@/components/ui';

/** Opens the online match form for the peer; the match then comes to them in this chat as an invitation. */
export function InviteButton({ peer }: { peer: { id: string; displayName: string } }) {
  const { t } = useTranslation();
  return (
    <Link to={paths.chatInvite(peer)} className={buttonClass({ variant: 'secondary', size: 'sm' })}>
      <PlayIcon />
      {t('chat.invite')}
    </Link>
  );
}
