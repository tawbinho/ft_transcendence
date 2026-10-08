import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PlayIcon, TrashIcon } from '@/components/icons';
import { Alert, Button, Card, ConfirmDialog } from '@/components/ui';
import { useUser } from '@/features/auth/hooks';
import { useDeleteTournament, useTournamentAction } from '@/features/tournaments/hooks';
import { MIN_TOURNAMENT_PLAYERS, type Tournament } from '@/features/tournaments/types';
import { canCancel, canJoin, canLeave, canStart } from '@/features/tournaments/view';
import { useErrorMessage } from '@/lib/errorMessage';

/** Join, leave, start early or cancel, while players register. Each button shows only when it can be used. */
export function Registration({ tournament }: { tournament: Tournament }) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const viewerId = useUser()?.id;
  const join = useTournamentAction(tournament.id, 'join');
  const leave = useTournamentAction(tournament.id, 'leave');
  const start = useTournamentAction(tournament.id, 'start');
  const remove = useDeleteTournament(tournament.id);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const error = join.error ?? leave.error ?? start.error ?? remove.error;
  const isCreator = canCancel(tournament, viewerId);

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-bold">{t('tournaments.registrationOpen')}</h2>
        <p className="text-muted">
          {t('tournaments.registrationBody', { size: tournament.size, min: MIN_TOURNAMENT_PLAYERS })}
        </p>
      </div>
      {error && <Alert tone="danger">{errorMessage(error)}</Alert>}
      <div className="flex flex-wrap gap-2">
        {canJoin(tournament) && (
          <Button loading={join.isPending} onClick={() => join.mutate()}>
            {t('tournaments.join')}
          </Button>
        )}
        {canLeave(tournament, viewerId) && (
          <Button variant="secondary" loading={leave.isPending} onClick={() => leave.mutate()}>
            {t('tournaments.leave')}
          </Button>
        )}
        {isCreator && (
          <>
            <Button loading={start.isPending} disabled={!canStart(tournament, viewerId)} onClick={() => start.mutate()}>
              <PlayIcon />
              {t('tournaments.startNow')}
            </Button>
            <Button variant="ghost" onClick={() => setConfirmingDelete(true)}>
              <TrashIcon />
              {t('tournaments.delete')}
            </Button>
          </>
        )}
      </div>
      {isCreator && !canStart(tournament, viewerId) && (
        <p className="text-sm text-muted">{t('tournaments.needMorePlayers', { min: MIN_TOURNAMENT_PLAYERS })}</p>
      )}
      <ConfirmDialog
        open={confirmingDelete}
        title={t('tournaments.deleteTitle')}
        confirmLabel={t('tournaments.delete')}
        confirmVariant="danger"
        loading={remove.isPending}
        onClose={() => setConfirmingDelete(false)}
        onConfirm={() => remove.mutate(undefined, { onError: () => setConfirmingDelete(false) })}
      >
        {t('tournaments.deleteBody')}
      </ConfirmDialog>
    </Card>
  );
}
