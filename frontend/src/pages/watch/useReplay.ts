import { useEffect, useState } from 'react';

/** Time between two moves while the replay plays by itself. */
export const REPLAY_STEP_MS = 900;

/**
 * Where a replay is: the number of moves shown, and whether it plays by itself.
 * It opens on the last position (the result); Play from there starts over.
 */
export function useReplay(total: number) {
  const [step, setStep] = useState(total);
  const [wantsToPlay, setWantsToPlay] = useState(false);

  // The match can still be read while it is loading in more moves: stay inside it.
  const shown = Math.min(step, total);
  const playing = wantsToPlay && shown < total;

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setStep((current) => Math.min(current + 1, total)), REPLAY_STEP_MS);
    return () => clearInterval(timer);
  }, [playing, total]);

  return {
    step: shown,
    playing,
    /** Shows a position; the replay stops playing by itself. */
    goTo(next: number) {
      setWantsToPlay(false);
      setStep(Math.max(0, Math.min(total, next)));
    },
    togglePlay() {
      if (playing) {
        setWantsToPlay(false);
        return;
      }
      if (shown >= total) setStep(0);
      setWantsToPlay(true);
    },
  };
}
