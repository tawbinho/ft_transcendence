import type { KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { PlayIcon } from '@/components/icons';
import { IconButton } from '@/components/ui';
import { stepForKey } from '@/features/matches/replay';
import { PauseIcon, SkipEndIcon, SkipStartIcon, StepBackIcon, StepForwardIcon } from './replayIcons';

/** The buttons, the slider and the key shortcuts that move through a finished match. */
export function ReplayControls({
  step,
  total,
  playing,
  announcement,
  onStep,
  onTogglePlay,
}: {
  /** Moves shown on the board, from 0 to `total`. */
  step: number;
  total: number;
  playing: boolean;
  /** Read aloud by screen readers every time the position changes. */
  announcement: string;
  onStep: (step: number) => void;
  onTogglePlay: () => void;
}) {
  const { t } = useTranslation();

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    // The slider already moves with these keys; handling them twice would skip a move.
    if (event.target instanceof HTMLInputElement) return;
    const next = stepForKey(event.key, step, total);
    if (next === null) return;
    event.preventDefault();
    onStep(next);
  }

  // Buttons that cannot move further stay focusable (aria-disabled, not disabled), so a keyboard
  // user who reaches the end does not lose their place; stepping past either end does nothing.
  return (
    <section
      aria-label={t('watch.replay.controls')}
      onKeyDown={onKeyDown}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4"
    >
      <div dir="ltr" className="flex items-center justify-center gap-2">
        <IconButton
          variant="secondary"
          label={t('watch.replay.first')}
          aria-disabled={step === 0}
          className="aria-disabled:opacity-55"
          onClick={() => onStep(0)}
        >
          <SkipStartIcon />
        </IconButton>
        <IconButton
          variant="secondary"
          label={t('watch.replay.previous')}
          aria-disabled={step === 0}
          className="aria-disabled:opacity-55"
          onClick={() => onStep(step - 1)}
        >
          <StepBackIcon />
        </IconButton>
        <IconButton
          label={playing ? t('watch.replay.pause') : t('watch.replay.play')}
          onClick={onTogglePlay}
          className="bg-primary text-primary-fg hover:bg-primary-hover"
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </IconButton>
        <IconButton
          variant="secondary"
          label={t('watch.replay.next')}
          aria-disabled={step === total}
          className="aria-disabled:opacity-55"
          onClick={() => onStep(step + 1)}
        >
          <StepForwardIcon />
        </IconButton>
        <IconButton
          variant="secondary"
          label={t('watch.replay.last')}
          aria-disabled={step === total}
          className="aria-disabled:opacity-55"
          onClick={() => onStep(total)}
        >
          <SkipEndIcon />
        </IconButton>
      </div>

      <input
        type="range"
        dir="ltr"
        min={0}
        max={total}
        value={step}
        aria-label={t('watch.replay.slider')}
        aria-valuetext={t('watch.replay.step', { step, total })}
        onChange={(event) => onStep(Number(event.target.value))}
        className="w-full accent-primary"
      />

      <p className="text-center text-sm font-semibold tabular-nums">{t('watch.replay.step', { step, total })}</p>
      <p className="text-center text-sm text-muted">{t('watch.replay.keys')}</p>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </section>
  );
}
