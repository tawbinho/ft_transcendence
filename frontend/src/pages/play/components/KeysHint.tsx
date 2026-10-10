import { useTranslation } from 'react-i18next';
import { Kbd } from '@/components/ui';

/**
 * A reminder under the game summary that the board can be played with the keyboard.
 * The keys are drawn as keys, in a left-to-right group: a sentence that mixes arrows
 * and digits with Arabic text would otherwise put them in the wrong order. Each key
 * group stays with its words, so a narrow column breaks between the two hints.
 */
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
          <Kbd>1</Kbd>–<Kbd>9</Kbd>
        </span>
        {t('game.keysDrop')}
      </span>
    </p>
  );
}
