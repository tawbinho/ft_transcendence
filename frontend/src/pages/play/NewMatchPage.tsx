import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { paths } from '@/app/paths';
import { PageHeader } from '@/components/PageHeader';
import { Alert, Button, Card, TextField } from '@/components/ui';
import { useUser } from '@/features/auth/hooks';
import { validateDisplayName } from '@/features/auth/validation';
import { Board } from '@/features/game/components/Board';
import { BoardSettingsFields } from '@/features/game/components/BoardSettingsFields';
import { createGame } from '@/features/game/engine';
import { DEFAULT_BOARD_SETTINGS, type BoardSettings } from '@/features/game/settings';
import { useCreateMatch } from '@/features/matches/hooks';
import { isApiError } from '@/lib/api/errors';
import { useErrorMessage } from '@/lib/errorMessage';

const OPPONENT_ERRORS = ['USER_NOT_FOUND', 'CANNOT_INVITE_SELF'];

export function NewMatchPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const errorMessage = useErrorMessage();
  const user = useUser();
  const create = useCreateMatch();

  // "Challenge" buttons on profiles and in the friend list fill in the opponent.
  const [params] = useSearchParams();
  const [opponent, setOpponent] = useState(() => params.get('opponent') ?? '');
  const [settings, setSettings] = useState<BoardSettings>(DEFAULT_BOARD_SETTINGS);
  const [submitted, setSubmitted] = useState(false);

  const name = opponent.trim();
  const localError =
    name && submitted
      ? (validateDisplayName(name) ?? (name === user?.displayName ? 'errors.CANNOT_INVITE_SELF' : null))
      : null;
  const serverOpponentError = OPPONENT_ERRORS.some((code) => isApiError(create.error, code));
  const opponentError = localError ? t(localError) : serverOpponentError ? errorMessage(create.error) : null;

  function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (name && validateDisplayName(name)) return;
    create.mutate(
      { settings, ...(name ? { opponentDisplayName: name } : {}) },
      { onSuccess: (match) => navigate(paths.match(match.id)) },
    );
  }

  const preview = createGame(settings);

  return (
    <>
      <PageHeader title={t('online.createTitle')} subtitle={t('online.createSubtitle')} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <form onSubmit={submit} noValidate className="flex flex-col gap-7">
            {create.error && !serverOpponentError && (
              <Alert
                tone="danger"
                action={
                  isApiError(create.error, 'TOO_MANY_WAITING_MATCHES') && (
                    <Link to="/matches?status=waiting" className="font-semibold text-primary hover:underline">
                      {t('nav.matches')}
                    </Link>
                  )
                }
              >
                {errorMessage(create.error)}
              </Alert>
            )}
            <TextField
              label={
                <>
                  {t('online.opponent')} <span className="font-normal text-muted">({t('common.optional')})</span>
                </>
              }
              hint={t('online.opponentHint')}
              value={opponent}
              onChange={(event) => {
                setOpponent(event.target.value);
                if (serverOpponentError) create.reset();
              }}
              error={opponentError}
              maxLength={20}
              autoComplete="off"
              spellCheck={false}
            />
            <BoardSettingsFields value={settings} onChange={setSettings} />
            <Button type="submit" size="lg" className="self-start" loading={create.isPending}>
              {t('online.create')}
            </Button>
          </form>
        </Card>
        <div className="lg:sticky lg:top-24">
          <Board
            theme={settings.theme}
            model={{ ...preview.settings, board: preview.board, lastMove: null, winningLine: null }}
          />
        </div>
      </div>
    </>
  );
}
