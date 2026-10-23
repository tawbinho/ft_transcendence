import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { paths } from '@/app/paths';
import { PageHeader } from '@/components/PageHeader';
import { Alert, Button, Card } from '@/components/ui';
import { useSendMessage } from '@/features/chat/hooks';
import { Board } from '@/features/game/components/Board';
import { BoardSettingsFields } from '@/features/game/components/BoardSettingsFields';
import { createGame } from '@/features/game/engine';
import { loadLastSettings, saveLastSettings } from '@/features/game/lastSettings';
import type { BoardSettings } from '@/features/game/settings';
import { useCreateMatch } from '@/features/matches/hooks';
import { isApiError } from '@/lib/api/errors';
import { useErrorMessage } from '@/lib/errorMessage';
import { OpenMatchNotice } from './online/OpenMatchNotice';
import { OpponentPicks, type Opponent } from './online/OpponentPicks';

export function NewMatchPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const errorMessage = useErrorMessage();
  const create = useCreateMatch();

  // A profile's Challenge and a chat's Invite fill in the opponent: ?opponent=<name>&invite=<id>.
  const [params] = useSearchParams();
  const [opponent, setOpponent] = useState<Opponent | null>(() => {
    const displayName = params.get('opponent');
    const id = params.get('invite');
    return displayName && id ? { id, displayName } : null;
  });
  // The match is kept for that player, and they are told in the chat: the invitation opens it.
  const sendInvite = useSendMessage(opponent?.id ?? '');
  const [settings, setSettings] = useState<BoardSettings>(loadLastSettings);

  function pick(next: Opponent | null) {
    setOpponent(next);
    create.reset();
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    saveLastSettings(settings);
    create.mutate(
      { settings, ...(opponent ? { opponentDisplayName: opponent.displayName } : {}) },
      {
        onSuccess: (match) => {
          const open = () => void navigate(paths.match(match.id));
          // The match opens even if the message fails: its link can still be shared from there.
          if (opponent) sendInvite.mutate({ matchId: match.id }, { onSettled: open });
          else open();
        },
      },
    );
  }

  const preview = createGame(settings);

  return (
    <>
      <PageHeader title={t('online.createTitle')} subtitle={t('online.createSubtitle')} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <form onSubmit={submit} noValidate className="flex flex-col gap-7">
            {create.error && (
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
            <OpenMatchNotice />
            <OpponentPicks selected={opponent} onPick={pick} />
            <BoardSettingsFields value={settings} onChange={setSettings} />
            <Button type="submit" size="lg" className="self-start" loading={create.isPending || sendInvite.isPending}>
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
