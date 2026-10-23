import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import { paths } from '@/app/paths';
import { Alert, Button, buttonClass, Card } from '@/components/ui';
import { useSendMessage } from '@/features/chat/hooks';
import { normalizeSettings, toBoardTheme } from '@/features/game/settings';
import { useCreateMatch } from '@/features/matches/hooks';
import { opponentOf } from '@/features/matches/model';
import type { Match } from '@/features/matches/types';
import { isComputerPlayer } from '@/features/users/computerPlayers';
import { useErrorMessage } from '@/lib/errorMessage';

/**
 * What to do after an online match: a rematch with the same board, a new match, or the history.
 * A person is told about the rematch in the chat (the server does not tell them); a computer joins by itself.
 */
export function ResultActions({ match }: { match: Match }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const errorMessage = useErrorMessage();
  const rematch = useCreateMatch();
  const opponent = opponentOf(match);
  const person =
    opponent && !isComputerPlayer(opponent) ? { id: opponent.userId, displayName: opponent.displayName } : null;
  const invite = useSendMessage(person?.id ?? '');
  // New match: the online form with the same person picked, or the computer page.
  const newMatch = person ? paths.challenge(person) : opponent ? '/play/computer' : '/play/online';

  function startRematch() {
    if (!opponent) return;
    const settings = normalizeSettings({ ...match.settings, theme: toBoardTheme(match.settings.theme) });
    rematch.mutate(
      { settings, opponentDisplayName: opponent.displayName },
      {
        onSuccess: (created) => {
          const open = () => void navigate(paths.match(created.id));
          if (person) invite.mutate({ matchId: created.id }, { onSettled: open });
          else open();
        },
      },
    );
  }

  return (
    <Card className="flex flex-col gap-2 p-4 sm:p-4">
      {rematch.error && <Alert tone="danger">{errorMessage(rematch.error)}</Alert>}
      {opponent && (
        <Button loading={rematch.isPending || invite.isPending} onClick={startRematch}>
          {t('online.rematch')}
        </Button>
      )}
      <Link to={newMatch} className={buttonClass({ variant: 'secondary' })}>
        {t('online.newMatch')}
      </Link>
      <Link to="/matches" className={buttonClass({ variant: 'ghost' })}>
        {t('online.allMatches')}
      </Link>
    </Card>
  );
}
