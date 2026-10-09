import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { paths } from '@/app/paths';
import { PlayIcon } from '@/components/icons';
import { Alert, Button } from '@/components/ui';
import { DEFAULT_BOARD_SETTINGS } from '@/features/game/settings';
import { useCreateMatch } from '@/features/matches/hooks';
import { useErrorMessage } from '@/lib/errorMessage';
import { useSendMessage } from '../hooks';

/** Creates a match reserved for the peer, sends them the invitation, and opens the match. */
export function InviteButton({ peer }: { peer: { id: string; displayName: string } }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const errorMessage = useErrorMessage();
  const create = useCreateMatch();
  const send = useSendMessage(peer.id);
  const error = create.error ?? send.error;

  function invite() {
    create.mutate(
      { settings: DEFAULT_BOARD_SETTINGS, opponentDisplayName: peer.displayName },
      {
        onSuccess: (match) =>
          send.mutate({ matchId: match.id }, { onSuccess: () => void navigate(paths.match(match.id)) }),
      },
    );
  }

  return (
    <>
      <Button size="sm" variant="secondary" loading={create.isPending || send.isPending} onClick={invite}>
        <PlayIcon />
        {t('chat.invite')}
      </Button>
      {error && (
        <Alert tone="danger" className="basis-full">
          {errorMessage(error)}
        </Alert>
      )}
    </>
  );
}
