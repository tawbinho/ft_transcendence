import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { Alert, Button, Card } from '@/components/ui';
import { useJoinMatch } from '@/features/matches/hooks';
import { isApiError } from '@/lib/api/errors';
import { useErrorMessage } from '@/lib/errorMessage';
import { Unavailable } from './Unavailable';

/** Errors that mean this match can never be joined by this person. */
const CLOSED = ['MATCH_NOT_FOUND', 'MATCH_NOT_JOINABLE', 'NOT_INVITED'];

/** A shared link opened by someone who is not in the match yet. */
export function JoinMatch({ id }: { id: string }) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const join = useJoinMatch(id);

  if (CLOSED.some((code) => isApiError(join.error, code))) {
    return <Unavailable reason={errorMessage(join.error)} />;
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title={t('online.joinTitle')} />
      <Card className="flex flex-col items-start gap-4">
        <p className="text-muted">{t('online.joinBody')}</p>
        {join.error && <Alert tone="danger">{errorMessage(join.error)}</Alert>}
        <Button size="lg" loading={join.isPending} onClick={() => join.mutate()}>
          {t('online.join')}
        </Button>
      </Card>
    </div>
  );
}
