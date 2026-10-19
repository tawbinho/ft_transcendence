import { useId, useRef, type ClipboardEvent, type KeyboardEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';

const LENGTH = 6;

interface OtpInputProps {
  label: string;
  /**
   * One character per box, up to 6: a digit, or a space for an empty box, so
   * "12 456" has its third box empty. The code is complete when it is 6 digits.
   */
  value: string;
  onChange: (value: string) => void;
  /** Called once with the 6 digits, as soon as the last one is typed or pasted. */
  onComplete?: (code: string) => void;
  error?: ReactNode;
  disabled?: boolean;
  autoFocus?: boolean;
}

/** Six boxes for a one-time code: auto-advance, Backspace, arrows and paste. */
export function OtpInput({ label, value, onChange, onComplete, error, disabled, autoFocus }: OtpInputProps) {
  const { t } = useTranslation();
  const id = useId();
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  const focus = (index: number) => boxes.current[Math.max(0, Math.min(LENGTH - 1, index))]?.focus();

  // Empty boxes stay spaces, so emptying a middle box does not move the digits
  // after it. Spaces at the end are dropped: no digit at all gives ''.
  function update(next: string[]) {
    const joined = next.join('').trimEnd();
    onChange(joined);
    if (/^\d{6}$/.test(joined)) onComplete?.(joined);
  }
  const slots = () => Array.from({ length: LENGTH }, (_, i) => value[i] ?? ' ');
  const digitAt = (index: number) => (value[index] ?? '').trim();

  function type(index: number, raw: string) {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return;
    const next = slots();
    next[index] = digits.slice(-1);
    update(next);
    focus(index + 1);
  }

  function key(index: number, event: KeyboardEvent) {
    if (event.key === 'Backspace') {
      event.preventDefault();
      const next = slots();
      if (next[index] !== ' ') next[index] = ' ';
      else if (index > 0) {
        next[index - 1] = ' ';
        focus(index - 1);
      }
      update(next);
    } else if (event.key === 'ArrowLeft') focus(index - 1);
    else if (event.key === 'ArrowRight') focus(index + 1);
  }

  function paste(event: ClipboardEvent) {
    const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, LENGTH);
    if (!digits) return;
    event.preventDefault();
    onChange(digits);
    if (digits.length === LENGTH) onComplete?.(digits);
    focus(digits.length);
  }

  return (
    <div role="group" aria-labelledby={`${id}-label`} className="flex flex-col items-center gap-2">
      <span id={`${id}-label`} className="sr-only">
        {label}
      </span>
      <div className="flex gap-2 sm:gap-3" dir="ltr">
        {Array.from({ length: LENGTH }, (_, i) => (
          <input
            key={i}
            ref={(el) => {
              boxes.current[i] = el;
            }}
            value={digitAt(i)}
            onChange={(event) => type(i, event.target.value)}
            onKeyDown={(event) => key(i, event)}
            onPaste={paste}
            onFocus={(event) => event.target.select()}
            aria-label={t('common.codeDigit', { label, digit: i + 1, total: LENGTH })}
            aria-invalid={error ? true : undefined}
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            autoFocus={autoFocus && i === 0}
            disabled={disabled}
            maxLength={2}
            className={cn(
              'h-14 w-11 rounded-control border bg-surface text-center text-2xl font-bold text-fg sm:w-12',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
              error ? 'border-danger' : digitAt(i) ? 'border-primary' : 'border-border',
            )}
          />
        ))}
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
