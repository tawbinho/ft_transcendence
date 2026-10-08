import { useTranslation } from 'react-i18next';
import { PlayIcon, RefreshIcon } from '@/components/icons';
import { PageHeader } from '@/components/PageHeader';
import { Button, Card, ProgressBar } from '@/components/ui';
import type { LocalTournament } from '@/features/tournaments/local';
import { countMatches } from '@/features/tournaments/view';

/** Shown when the page opens on a tournament that was left unfinished on this device. */
export function ResumePrompt({
  tournament,
  onResume,
  onStartNew,
}: {
  tournament: LocalTournament;
  onResume: () => void;
  onStartNew: () => void;
}) {
  const { t } = useTranslation();
  const { played, total } = countMatches(tournament.bracket);
  const progress = t('localTournament.progress', { played, total });

  return (
    <>
      <PageHeader title={t('localTournament.resumeTitle')} />
      <Card className="mx-auto flex max-w-2xl flex-col gap-5">
        <p className="text-lg">{t('localTournament.resumeBody', { names: tournament.players.join(', ') })}</p>
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted">{progress}</p>
          <ProgressBar value={played} max={total} label={progress} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="lg" onClick={onResume}>
            <PlayIcon />
            {t('localTournament.resumeAction')}
          </Button>
          <Button size="lg" variant="secondary" onClick={onStartNew}>
            <RefreshIcon />
            {t('localTournament.startNew')}
          </Button>
        </div>
        <p className="text-sm text-muted">{t('localTournament.startNewHint')}</p>
      </Card>
    </>
  );
}
