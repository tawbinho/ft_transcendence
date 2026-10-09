import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

const RADII = [
  { name: 'rounded-control', className: 'rounded-control', use: 'control' },
  { name: 'rounded-card', className: 'rounded-card', use: 'card' },
  { name: 'rounded-full', className: 'rounded-full', use: 'round' },
] as const;

const SHADOWS = [
  { name: 'shadow-card', className: 'shadow-card', use: 'shadowCard' },
  { name: 'shadow-pop', className: 'shadow-pop', use: 'shadowPop' },
] as const;

const MOTION = [
  { name: '--duration-fast', value: '120 ms', use: 'fast' },
  { name: '--duration-base', value: '200 ms', use: 'base' },
  { name: '--duration-slow', value: '400 ms', use: 'slow' },
] as const;

function TokenCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-w-0 rounded-card border border-border bg-surface p-5 shadow-card">
      <h3 className="mb-4 font-bold">{title}</h3>
      <ul className="flex flex-col gap-4">{children}</ul>
    </div>
  );
}

/** Corner radii, shadows and motion: the other values the components share. */
export function TokensSection() {
  const { t } = useTranslation();
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <TokenCard title={t('design.tokens.radii')}>
        {RADII.map(({ name, className, use }) => (
          <li key={name} className="flex items-center gap-4">
            <span className={`size-14 flex-none border border-border bg-surface-2 ${className}`} />
            <span className="min-w-0 text-sm">
              <code dir="ltr" className="font-semibold">
                {name}
              </code>
              <span className="block text-muted">{t(`design.tokens.${use}`)}</span>
            </span>
          </li>
        ))}
      </TokenCard>

      <TokenCard title={t('design.tokens.shadows')}>
        {SHADOWS.map(({ name, className, use }) => (
          <li key={name} className="flex items-center gap-4">
            <span className={`size-14 flex-none rounded-control bg-surface ${className}`} />
            <span className="min-w-0 text-sm">
              <code dir="ltr" className="font-semibold">
                {name}
              </code>
              <span className="block text-muted">{t(`design.tokens.${use}`)}</span>
            </span>
          </li>
        ))}
      </TokenCard>

      <TokenCard title={t('design.tokens.motion')}>
        {MOTION.map(({ name, value, use }) => (
          <li key={name} className="text-sm">
            <code dir="ltr" className="font-semibold">
              {name}
            </code>{' '}
            · {value}
            <span className="block text-muted">{t(`design.tokens.${use}`)}</span>
          </li>
        ))}
        <li className="text-sm text-muted">{t('design.tokens.reduced')}</li>
      </TokenCard>
    </div>
  );
}
