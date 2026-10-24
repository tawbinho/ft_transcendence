import { useIsMutating } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { Alert, Button, PageSpinner } from '@/components/ui';
import { matchKeys, useMatch } from '@/features/matches/hooks';
import { isMatchId } from '@/features/matches/model';
import { isApiError } from '@/lib/api/errors';
import { useErrorMessage } from '@/lib/errorMessage';
import { JoinMatch } from './online/JoinMatch';
import { OnlineGame } from './online/OnlineGame';
import { Unavailable } from './online/Unavailable';
import { WaitingRoom } from './online/WaitingRoom';

/** /matches/:matchId: loads the match and shows the screen that fits its state. */
export function MatchPage() {
  const { matchId = '' } = useParams();
  return isMatchId(matchId) ? <MatchScreen key={matchId} id={matchId} /> : <Unavailable />;
}

function MatchScreen({ id }: { id: string }) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const moving = useIsMutating({ mutationKey: matchKeys.move(id) }) > 0;
  const query = useMatch(id, { paused: moving });

  if (query.isPending) return <PageSpinner />;
  if (!query.data) {
    // The server lets anyone read a match while it waits for its second player.
    // So "not found" means a match that does not exist, or one that already
    // started or ended without this person: there is nothing to join.
    if (isApiError(query.error, 'MATCH_NOT_FOUND')) return <Unavailable />;
    return (
      <Alert
        tone="danger"
        title={t('errors.title')}
        action={
          <Button size="sm" variant="secondary" loading={query.isFetching} onClick={() => void query.refetch()}>
            {t('common.retry')}
          </Button>
        }
      >
        {errorMessage(query.error)}
      </Alert>
    );
  }

  const match = query.data;
  // Someone who does not play in this match can only join it while it waits.
  if (match.yourSeat === null) {
    return match.status === 'waiting' ? <JoinMatch id={id} /> : <Unavailable />;
  }
  if (match.status === 'waiting') return <WaitingRoom match={match} />;
  return <OnlineGame match={match} syncFailed={query.isRefetchError} />;
}
