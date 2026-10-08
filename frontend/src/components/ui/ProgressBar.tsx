import { cn } from '@/lib/cn';

/** How far along something is, for example wins toward the next level. */
export function ProgressBar({
  value,
  max = 100,
  label,
  className,
}: {
  value: number;
  max?: number;
  /** What is measured, read aloud with the value. */
  label: string;
  className?: string;
}) {
  const clamped = Math.min(Math.max(value, 0), max);
  const percent = max > 0 ? (clamped / max) * 100 : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={clamped}
      className={cn('h-2.5 w-full overflow-hidden rounded-full bg-surface-2', className)}
    >
      <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${percent}%` }} />
    </div>
  );
}
