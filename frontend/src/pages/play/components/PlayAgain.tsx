import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { RefreshIcon } from '@/components/icons';
import { buttonClass, Card } from '@/components/ui';
import { loadLastSettings } from '@/features/game/lastSettings';

/**
 * Starts a same-screen game at once with the board of the last one played on
 * this device. `?start=1` tells the setup page to skip the form.
 */
export function PlayAgain() {
  const { t } = useTranslation();
  const [last] = useState(loadLastSettings);

  return (
    <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-11 flex-none place-items-center rounded-xl bg-primary/12 text-2xl text-primary">
          <RefreshIcon />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-bold">{t('play.again.title')}</h2>
          <p className="text-muted">{t('play.again.body', { cols: last.cols, rows: last.rows, n: last.winLength })}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link to="/play/local?start=1" className={buttonClass({ variant: 'secondary' })}>
          {t('play.again.local')}
        </Link>
      </div>
    </Card>
  );
}
