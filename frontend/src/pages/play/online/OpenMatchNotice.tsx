import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { Alert } from '@/components/ui';
import { useMatchList } from '@/features/matches/hooks';

/**
 * A way back to the member's match that is not over: once they leave its page (to send its link in
 * the chat, for example), nothing else on the Play pages leads back to it. A game being played comes
 * before a match still waiting for its second player.
 */
export function OpenMatchNotice() {
  const { t } = useTranslation();
  const playing = useMatchList({ status: 'in_progress', limit: 1 }).data?.items[0];
  const waiting = useMatchList({ status: 'waiting', limit: 1 }).data?.items[0];
  const match = playing ?? waiting;
  if (!match) return null;

  return (
    <Alert
      tone="info"
      action={
        <Link to={paths.match(match.id)} className="font-semibold text-primary hover:underline">
          {t('online.openMatch')}
        </Link>
      }
    >
      {match.status === 'waiting' ? t('online.waitingNotice') : t('online.playingNotice')}
    </Alert>
  );
}
