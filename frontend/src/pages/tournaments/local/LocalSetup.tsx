import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon, PlusIcon } from '@/components/icons';
import { PageHeader } from '@/components/PageHeader';
import { Button, Card, TextField } from '@/components/ui';
import { BoardSettingsFields } from '@/features/game/components/BoardSettingsFields';
import { loadLastSettings, saveLastSettings } from '@/features/game/lastSettings';
import type { BoardSettings } from '@/features/game/settings';
import { ALIAS_MAX, LOCAL_MAX_PLAYERS, LOCAL_MIN_PLAYERS, validateAliases } from '@/features/tournaments/local';

/** The first screen of a same-screen tournament: the players' names and the board. */
export function LocalSetup({ onStart }: { onStart: (names: string[], settings: BoardSettings) => void }) {
  const { t } = useTranslation();
  const [names, setNames] = useState<string[]>(['', '', '', '']);
  const [settings, setSettings] = useState<BoardSettings>(loadLastSettings);
  const [submitted, setSubmitted] = useState(false);
  const errors = validateAliases(names);

  function setName(index: number, value: string) {
    setNames(names.map((name, i) => (i === index ? value : name)));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (errors.some(Boolean)) return;
    saveLastSettings(settings);
    onStart(names, settings);
  }

  return (
    <>
      <PageHeader title={t('localTournament.title')} subtitle={t('localTournament.subtitle')} />
      <Card className="mx-auto max-w-3xl">
        <form onSubmit={submit} noValidate className="flex flex-col gap-7">
          <fieldset className="flex flex-col gap-4">
            <legend className="mb-1 text-lg font-bold">{t('localTournament.players')}</legend>
            <p className="text-sm text-muted">
              {t('localTournament.playersHint', { min: LOCAL_MIN_PLAYERS, max: LOCAL_MAX_PLAYERS })}
            </p>
            <ol className="grid gap-3 sm:grid-cols-2">
              {names.map((name, index) => (
                <li key={index} className="flex items-start gap-2">
                  <TextField
                    className="min-w-0 flex-1"
                    label={t('offline.playerName', { n: index + 1 })}
                    value={name}
                    maxLength={ALIAS_MAX}
                    autoComplete="off"
                    onChange={(event) => setName(index, event.target.value)}
                    error={submitted && errors[index] ? t(errors[index]) : null}
                  />
                  {names.length > LOCAL_MIN_PLAYERS && (
                    <Button
                      variant="ghost"
                      className="mt-7 size-11 flex-none p-0"
                      onClick={() => setNames(names.filter((_, i) => i !== index))}
                    >
                      <CloseIcon />
                      <span className="sr-only">{t('localTournament.removePlayer', { n: index + 1 })}</span>
                    </Button>
                  )}
                </li>
              ))}
            </ol>
            {names.length < LOCAL_MAX_PLAYERS && (
              <Button variant="secondary" className="self-start" onClick={() => setNames([...names, ''])}>
                <PlusIcon />
                {t('localTournament.addPlayer')}
              </Button>
            )}
          </fieldset>
          <BoardSettingsFields value={settings} onChange={setSettings} />
          <Button type="submit" size="lg" className="self-start">
            {t('localTournament.start')}
          </Button>
        </form>
      </Card>
    </>
  );
}
