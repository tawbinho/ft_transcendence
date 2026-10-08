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

/** Full-area loading state with an accessible label. */
export function PageSpinner({ label }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <div role="status" className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted">
      <Spinner className="size-8 text-primary" />
      <span>{label ?? t('common.loading')}</span>
    </div>
  );
}
