import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import { paths } from '@/app/paths';
import { Alert, Button, buttonClass, Card } from '@/components/ui';
import { normalizeSettings, toBoardTheme } from '@/features/game/settings';
import { useCreateMatch } from '@/features/matches/hooks';
import { opponentOf } from '@/features/matches/model';
import type { Match } from '@/features/matches/types';
import { useErrorMessage } from '@/lib/errorMessage';

/** What to do after an online match: a rematch with the same board, a new match, or the history. */
export function ResultActions({ match }: { match: Match }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const errorMessage = useErrorMessage();
  const rematch = useCreateMatch();
  const opponent = opponentOf(match);

  function startRematch() {
    if (!opponent) return;
    const settings = normalizeSettings({ ...match.settings, theme: toBoardTheme(match.settings.theme) });
    rematch.mutate(
      { settings, opponentDisplayName: opponent.displayName },
      { onSuccess: (created) => navigate(paths.match(created.id)) },
    );
  }

  return (
    <Card className="flex flex-col gap-2 p-4 sm:p-4">
      {rematch.error && <Alert tone="danger">{errorMessage(rematch.error)}</Alert>}
      {opponent && (
        <Button loading={rematch.isPending} onClick={startRematch}>
          {t('online.rematch')}
        </Button>
      )}
      <Link to="/play/online" className={buttonClass({ variant: 'secondary' })}>
        {t('online.newMatch')}
      </Link>
      <Link to="/matches" className={buttonClass({ variant: 'ghost' })}>
        {t('online.allMatches')}
      </Link>
    </Card>
  );
}
