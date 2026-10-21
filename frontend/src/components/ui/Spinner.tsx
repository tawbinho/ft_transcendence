import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';

/** A decorative spinner; pair it with visible text or use PageSpinner. */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block size-5 animate-spin rounded-full border-2 border-current border-r-transparent',
        className,
      )}
    />
  );
}

/**
 * Loading state for a whole page, in the middle of the window. The label's box only keeps
 * some height in the page so it does not jump when the content arrives; the spinner itself
 * is fixed to the window, so it is centered wherever the page puts it.
 */
export function PageSpinner({ label }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <div role="status" className="min-h-[40vh]">
      <div className="pointer-events-none fixed inset-0 flex flex-col items-center justify-center gap-3 text-muted">
        <Spinner className="size-8 text-primary" />
        <span>{label ?? t('common.loading')}</span>
      </div>
    </div>
  );
}

/** Loading state for a list that shares the page with other content (filters, statistics): centered in a box of its own. */
export function SectionSpinner({ label }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <div role="status" className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted">
      <Spinner className="size-8 text-primary" />
      <span>{label ?? t('common.loading')}</span>
    </div>
  );
}
