import { useTranslation } from 'react-i18next';
import { RefreshIcon, SlidersIcon, UndoIcon } from '@/components/icons';
import { Button, Card } from '@/components/ui';

/** Play again, take a move back, or go back to the setup form. */
export function GameActions({
  gameOver,
  hasMoves,
  canUndo,
  onRestart,
  onUndo,
  onChangeSettings,
}: {
  gameOver: boolean;
  hasMoves: boolean;
  canUndo: boolean;
  onRestart: () => void;
  onUndo: () => void;
  onChangeSettings: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Card className="flex flex-col gap-2 p-4 sm:p-4">
      {/* After the game the restart button becomes the main action. */}
      <Button variant={gameOver ? 'primary' : 'secondary'} onClick={onRestart} disabled={!hasMoves}>
        <RefreshIcon />
        {t('offline.restart')}
      </Button>
      <Button variant="secondary" onClick={onUndo} disabled={!canUndo}>
        <UndoIcon />
        {t('offline.undo')}
      </Button>
      <Button variant="ghost" onClick={onChangeSettings}>
        <SlidersIcon />
        {t('offline.changeSettings')}
      </Button>
    </Card>
  );
}
