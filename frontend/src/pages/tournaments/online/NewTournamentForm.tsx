import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { paths } from '@/app/paths';
import { Alert, Button, Card, TextField } from '@/components/ui';
import { BoardSettingsFields } from '@/features/game/components/BoardSettingsFields';
import { loadLastSettings, saveLastSettings } from '@/features/game/lastSettings';
import type { BoardSettings } from '@/features/game/settings';
import { useCreateTournament } from '@/features/tournaments/hooks';
import { TOURNAMENT_NAME_MAX, validateTournamentName } from '@/features/tournaments/validation';
import { useErrorMessage } from '@/lib/errorMessage';

/** The form that creates an online tournament; the board starts from the last one used on this device. */
export function NewTournamentForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const errorMessage = useErrorMessage();
  const create = useCreateTournament();

  const [name, setName] = useState('');
  const [settings, setSettings] = useState<BoardSettings>(loadLastSettings);
  const [submitted, setSubmitted] = useState(false);
  const nameError = submitted ? validateTournamentName(name) : null;

  function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (validateTournamentName(name)) return;
    saveLastSettings(settings);
    create.mutate(
      { name: name.trim(), settings },
      { onSuccess: (tournament) => navigate(paths.tournament(tournament.id)) },
    );
  }

  return (
    <Card className="max-w-3xl">
      <form onSubmit={submit} noValidate className="flex flex-col gap-7">
        {create.error && <Alert tone="danger">{errorMessage(create.error)}</Alert>}
        <TextField
          label={t('tournaments.name')}
          hint={t('tournaments.nameHint')}
          value={name}
          maxLength={TOURNAMENT_NAME_MAX}
          autoComplete="off"
          required
          onChange={(event) => setName(event.target.value)}
          error={nameError ? t(nameError) : null}
        />
        <BoardSettingsFields value={settings} onChange={setSettings} />
        <Button type="submit" size="lg" className="self-start" loading={create.isPending}>
          {t('tournaments.create')}
        </Button>
      </form>
    </Card>
  );
}
