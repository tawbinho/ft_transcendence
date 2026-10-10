import { useTranslation } from 'react-i18next';
import type { Seat } from '../engine';
import type { BoardTheme } from '../settings';
import { PlayerTag } from './PlayerTag';

/** Both players with their disc color; the one whose turn it is stands out. */
export function PlayersBar({
  theme,
  names,
  activeSeat,
}: {
  theme: BoardTheme;
  /** Seat 1 first, then seat 2. */
  names: [string, string];
  /** null when nobody is to move (game over, computer thinking). */
  activeSeat: Seat | null;
}) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-2 gap-3">
      {([1, 2] as const).map((seat) => (
        <PlayerTag
          key={seat}
          seat={seat}
          theme={theme}
          name={names[seat - 1]}
          note={t(`themes.${theme}.seat${seat}`)}
          active={activeSeat === seat}
          align={seat === 2 ? 'end' : 'start'}
        />
      ))}
    </div>
  );
}
