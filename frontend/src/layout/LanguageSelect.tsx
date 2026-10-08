import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { GlobeIcon } from '@/components/icons';
import { LANGUAGES, isLanguage, useLanguage } from '@/i18n';
import { cn } from '@/lib/cn';

/** Compact language picker; the label stays available to screen readers. */
export function LanguageSelect({ className, showLabel = false }: { className?: string; showLabel?: boolean }) {
  const { t } = useTranslation();
  const [language, setLanguage] = useLanguage();
  const id = useId();

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <label htmlFor={id} className={cn(showLabel ? 'text-sm font-semibold' : 'sr-only')}>
        {t('preferences.language')}
      </label>
      <div className="relative flex items-center">
        <GlobeIcon className="pointer-events-none absolute start-2.5 text-muted" />
        <select
          id={id}
          value={language}
          onChange={(event) => isLanguage(event.target.value) && setLanguage(event.target.value)}
          className="h-9 appearance-none rounded-lg border border-border bg-surface ps-8 pe-3 text-sm font-medium text-fg hover:bg-surface-2"
        >
          {LANGUAGES.map(({ code, label }) => (
            <option key={code} value={code} lang={code}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
