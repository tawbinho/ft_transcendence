import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { paths } from '@/app/paths';
import { PageHeader } from '@/components/PageHeader';
import { Alert, Button, Card, OptionGroup, TextField } from '@/components/ui';
import { BoardSettingsFields } from '@/features/game/components/BoardSettingsFields';
import { DEFAULT_BOARD_SETTINGS, type BoardSettings } from '@/features/game/settings';
import { useCreateTournament } from '@/features/tournaments/hooks';
import { MIN_TOURNAMENT_PLAYERS, TOURNAMENT_SIZES, type TournamentSize } from '@/features/tournaments/types';
import { TOURNAMENT_NAME_MAX, validateTournamentName } from '@/features/tournaments/validation';
import { useErrorMessage } from '@/lib/errorMessage';

export function NewTournamentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const errorMessage = useErrorMessage();
  const create = useCreateTournament();

  const [name, setName] = useState('');
  const [size, setSize] = useState<TournamentSize>(4);
  const [settings, setSettings] = useState<BoardSettings>(DEFAULT_BOARD_SETTINGS);
  const [submitted, setSubmitted] = useState(false);
  const nameError = submitted ? validateTournamentName(name) : null;

  function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (validateTournamentName(name)) return;
    create.mutate(
      { name: name.trim(), size, settings },
      { onSuccess: (tournament) => navigate(paths.tournament(tournament.id)) },
    );
  }

  return (
    <>
      <PageHeader
        title={t('tournaments.newTitle')}
        subtitle={t('tournaments.newSubtitle', { min: MIN_TOURNAMENT_PLAYERS })}
      />
      <Card className="mx-auto max-w-3xl">
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
          <OptionGroup
            legend={t('tournaments.size')}
            value={String(size)}
            onChange={(value) => setSize(Number(value) as TournamentSize)}
            options={TOURNAMENT_SIZES.map((value) => ({
              value: String(value),
              label: t('tournaments.sizeOption', { count: value }),
            }))}
          />
          <BoardSettingsFields value={settings} onChange={setSettings} />
          <Button type="submit" size="lg" className="self-start" loading={create.isPending}>
            {t('tournaments.create')}
          </Button>
        </form>
      </Card>
    </>
  );
}
