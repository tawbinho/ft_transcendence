import { useTranslation } from 'react-i18next';

// The sizes the pages use, from the page title to the small hint (Tailwind's own scale).
const SCALE = [
  { role: 'pageTitle', classes: 'text-4xl font-extrabold tracking-tight', label: 'text-4xl · extrabold' },
  { role: 'sectionTitle', classes: 'text-2xl font-bold', label: 'text-2xl · bold' },
  { role: 'cardTitle', classes: 'text-xl font-bold', label: 'text-xl · bold' },
  { role: 'lead', classes: 'text-lg text-muted', label: 'text-lg' },
  { role: 'body', classes: 'text-base', label: 'text-base' },
  { role: 'label', classes: 'text-sm font-semibold', label: 'text-sm · semibold' },
  { role: 'hint', classes: 'text-xs text-muted', label: 'text-xs' },
] as const;

/** The type scale, with what each size is used for. */
export function TypeSection() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-6">
      <ul className="divide-y divide-border rounded-card border border-border bg-surface shadow-card">
        {SCALE.map(({ role, classes, label }) => (
          <li key={role} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-baseline sm:gap-6">
            <div className="shrink-0 text-sm text-muted sm:w-52">
              <p className="font-semibold text-fg">{t(`design.type.${role}`)}</p>
              <code className="text-xs">{label}</code>
            </div>
            <p className={`min-w-0 ${classes}`}>{t('design.type.sample')}</p>
          </li>
        ))}
      </ul>
      <p className="max-w-2xl text-muted">{t('design.type.fonts')}</p>
    </div>
  );
}
