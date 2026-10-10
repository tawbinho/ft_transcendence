import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { LoadError } from '@/components/LoadError';
import { PageHeader } from '@/components/PageHeader';
import { buttonClass, Card, PageSpinner } from '@/components/ui';
import { useTournament } from '@/features/tournaments/hooks';
import { isApiError } from '@/lib/api/errors';
import { TournamentView } from './online/TournamentView';

export function TournamentPage() {
  const { tournamentId = '' } = useParams();
  // A new key resets the page when the address changes to another tournament.
  return <TournamentLoader key={tournamentId} id={tournamentId} />;
}

/** Loads one tournament; the view itself is in online/TournamentView. */
function TournamentLoader({ id }: { id: string }) {
  const { t } = useTranslation();
  const query = useTournament(id);

  if (query.isPending) return <PageSpinner />;
  if (!query.data) {
    if (isApiError(query.error, 'TOURNAMENT_NOT_FOUND')) {
      return (
        <div className="mx-auto max-w-lg">
          <PageHeader title={t('tournaments.notFoundTitle')} />
          <Card className="flex flex-col items-start gap-4">
            <p className="text-muted">{t('errors.TOURNAMENT_NOT_FOUND')}</p>
            <Link to="/tournaments" className={buttonClass()}>
              {t('tournaments.title')}
            </Link>
          </Card>
        </div>
      );
    }
    return <LoadError error={query.error} onRetry={() => void query.refetch()} retrying={query.isFetching} />;
  }
  return <TournamentView tournament={query.data} />;
}
