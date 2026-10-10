import { Navigate, useParams } from 'react-router';
import { paths } from '@/app/paths';
import { LoadError } from '@/components/LoadError';
import { PageSpinner } from '@/components/ui';
import { useMatch } from '@/features/matches/hooks';
import { isMatchId, isOver } from '@/features/matches/model';
import { isApiError } from '@/lib/api/errors';
import { CannotWatch } from './CannotWatch';
import { SpectatorView } from './SpectatorView';

/** A match seen by someone who does not play in it: live while it is played, a replay once it is over. */
export function WatchMatchPage() {
  const { matchId = '' } = useParams();
  return isMatchId(matchId) ? <Spectate key={matchId} id={matchId} /> : <CannotWatch />;
}

function Spectate({ id }: { id: string }) {
  const query = useMatch(id);

  if (query.isPending) return <PageSpinner />;
  if (!query.data) {
    if (isApiError(query.error, 'MATCH_NOT_FOUND')) return <CannotWatch />;
    return <LoadError error={query.error} onRetry={() => void query.refetch()} retrying={query.isFetching} />;
  }

  const match = query.data;
  // A match still being played, or waiting for an opponent, is played on the match page.
  // Once it is over, its players can replay it here.
  if (!isOver(match) && (match.yourSeat !== null || match.status === 'waiting')) {
    return <Navigate to={paths.match(id)} replace />;
  }
  return <SpectatorView match={match} />;
}
