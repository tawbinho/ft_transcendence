import { useTranslation } from 'react-i18next';

/** A reminder under the game summary that the board can be played with the keyboard. */
export function KeysHint() {
  const { t } = useTranslation();
  return <p className="px-1 text-sm text-muted">{t('game.keysHint')}</p>;
}
