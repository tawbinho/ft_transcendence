import { useEffect, useRef, useState } from 'react';

/**
 * True from the moment `won` turns true while the page is open until it turns
 * false again. A game that was already won when the page opened (an old match
 * from the history) gets no party.
 */
export function useJustWon(won: boolean): boolean {
  const alreadyWon = useRef(won);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    if (!won) alreadyWon.current = false;
    setCelebrate(won && !alreadyWon.current);
  }, [won]);

  return celebrate;
}
