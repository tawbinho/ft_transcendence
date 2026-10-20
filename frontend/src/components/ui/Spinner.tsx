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
 * Loading state with an accessible label. It grows to fill the space around it
 * when its parent is a flex column (the page's <main> is), so it sits in the
 * middle of the page; inside a section it is centered in a box of its own.
 */
export function PageSpinner({ label }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <div role="status" className="flex min-h-[40vh] flex-1 flex-col items-center justify-center gap-3 text-muted">
      <Spinner className="size-8 text-primary" />
      <span>{label ?? t('common.loading')}</span>
    </div>
  );
}

/** The loading state before the page layout (header and footer) exists: centered in the whole window. */
export function ScreenSpinner() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PageSpinner />
    </div>
  );
}
