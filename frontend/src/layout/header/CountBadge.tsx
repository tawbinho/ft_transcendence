import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';

/**
 * A small red number on a link. Screen readers hear "new: 3" after the link
 * name, unless the link already says it in its label (`announce={false}`).
 */
export function CountBadge({
  count,
  announce = true,
  className,
}: {
  count: number;
  announce?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  if (count <= 0) return null;
  return (
    <>
      <span
        aria-hidden="true"
        className={cn(
          'grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1.5 text-xs font-bold text-white',
          className,
        )}
      >
        {count > 99 ? '99+' : count}
      </span>
      {announce && <span className="sr-only">, {t('nav.newCount', { count })}</span>}
    </>
  );
}
