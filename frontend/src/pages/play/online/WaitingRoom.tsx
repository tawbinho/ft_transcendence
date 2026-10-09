import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { paths } from '@/app/paths';
import { PageHeader } from '@/components/PageHeader';
import { Alert, Button, Card, ConfirmDialog, Spinner } from '@/components/ui';
import { GameSummary } from '@/features/game/components/GameSummary';
import { ShareLink } from '@/features/matches/components/ShareLink';
import { useResignMatch } from '@/features/matches/hooks';
import type { Match } from '@/features/matches/types';
import { useErrorMessage } from '@/lib/errorMessage';

/** Your match exists but nobody has joined: the link to send, and a way to cancel. */
export function WaitingRoom({ match }: { match: Match }) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const cancel = useResignMatch(match.id);
  const [confirming, setConfirming] = useState(false);
  const url = `${window.location.origin}${paths.match(match.id)}`;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <PageHeader title={t('online.waitingTitle')} subtitle={t('online.waitingBody')} className="mb-0" />
      <Card className="flex flex-col gap-5">
        <ShareLink url={url} />
        <p role="status" className="flex items-center gap-3 text-muted">
          <Spinner className="text-primary" />
          {t('online.waitingStatus')}
        </p>
        {cancel.error && <Alert tone="danger">{errorMessage(cancel.error)}</Alert>}
        <Button variant="secondary" className="self-start" onClick={() => setConfirming(true)}>
          {t('online.cancelMatch')}
        </Button>
      </Card>
      <GameSummary settings={match.settings} />
      <ConfirmDialog
        open={confirming}
        title={t('online.cancelTitle')}
        confirmLabel={t('online.cancelMatch')}
        confirmVariant="danger"
        loading={cancel.isPending}
        onClose={() => setConfirming(false)}
        onConfirm={() => cancel.mutate(undefined, { onSettled: () => setConfirming(false) })}
      >
        {t('online.cancelBody')}
      </ConfirmDialog>
    </div>
  );
}
