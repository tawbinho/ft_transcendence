import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { COLOR_SCHEMES, useColorScheme, type ColorScheme } from '@/lib/colorScheme';
import { cn } from '@/lib/cn';

export function ColorSchemeSelect({ className, showLabel = false }: { className?: string; showLabel?: boolean }) {
  const { t } = useTranslation();
  const [scheme, setScheme] = useColorScheme();
  const id = useId();

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <label htmlFor={id} className={cn(showLabel ? 'text-sm font-semibold' : 'sr-only')}>
        {t('preferences.appearance')}
      </label>
      <select
        id={id}
        value={scheme}
        onChange={(event) => setScheme(event.target.value as ColorScheme)}
        className="h-9 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-fg hover:bg-surface-2"
      >
        {COLOR_SCHEMES.map((option) => (
          <option key={option} value={option}>
            {t(`preferences.${option}`)}
          </option>
        ))}
      </select>
    </div>
  );
}
