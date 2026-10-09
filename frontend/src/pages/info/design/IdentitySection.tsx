import { useTranslation } from 'react-i18next';
import { LogoMark } from '@/components/LogoMark';
import { ILLUSTRATIONS, type IllustrationName } from '@/components/illustrations';

const NAMES: IllustrationName[] = ['board', 'trophy', 'chat', 'notFound'];

/** The logo, how it looks at each size, and the four illustrations. */
export function IdentitySection() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-8 rounded-card border border-border bg-surface p-6 shadow-card">
        <LogoMark className="size-24" />
        <div className="flex items-end gap-4" aria-hidden="true">
          {[16, 24, 32, 48].map((size) => (
            <LogoMark key={size} width={size} height={size} />
          ))}
        </div>
        <p className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          <LogoMark className="size-9" />
          {t('app.name')}
        </p>
      </div>

      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {NAMES.map((name) => {
          const Illustration = ILLUSTRATIONS[name];
          return (
            <li
              key={name}
              className="flex flex-col items-center gap-3 rounded-card border border-border bg-surface p-4 text-center shadow-card"
            >
              <Illustration className="h-24 w-auto" />
              <span className="text-sm text-muted">{t(`design.identity.${name}`)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
