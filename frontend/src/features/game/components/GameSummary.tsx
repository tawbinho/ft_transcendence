import { useTranslation } from 'react-i18next';
import type { GameSettings } from '../engine';
import { toBoardTheme } from '../settings';

/** The rules of the current game, as a short description list. */
export function GameSummary({
  settings,
  moveCount,
}: {
  settings: GameSettings & { theme: string };
  moveCount?: number;
}) {
  const { t } = useTranslation();
  const rows: [string, string][] = [
    [t('board.title'), t('game.size', { cols: settings.cols, rows: settings.rows })],
    [t('board.winLength'), String(settings.winLength)],
    [t('board.theme'), t(`themes.${toBoardTheme(settings.theme)}.name`)],
  ];
  if (moveCount !== undefined) rows.push([t('game.moves'), String(moveCount)]);

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-2xl border border-border bg-surface p-4 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted">{label}</dt>
          <dd className="text-end font-semibold tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
