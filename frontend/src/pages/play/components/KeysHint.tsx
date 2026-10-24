import { useTranslation } from 'react-i18next';
import { Kbd } from '@/components/ui';

/** A reminder under the game summary that the board can be played with the keyboard. */
export function KeysHint() {
  const { t } = useTranslation();
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-sm text-muted">
      <span>{t('game.keysLabel')}</span>
      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        <span dir="ltr" className="inline-flex items-center gap-1">
          <Kbd>←</Kbd>
          <Kbd>→</Kbd>
        </span>
        {t('game.keysMove')}
      </span>
      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        <span dir="ltr" className="inline-flex items-center gap-1">
          <Kbd>{t('play.help.keyEnter')}</Kbd>
        </span>
        {t('game.keysDrop')}
      </span>
    </p>
  );
}
