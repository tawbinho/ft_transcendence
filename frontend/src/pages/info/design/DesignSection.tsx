import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';

export type SectionId =
  'identity' | 'colors' | 'type' | 'tokens' | 'icons' | 'actions' | 'fields' | 'feedback' | 'display';

/** One part of the design page: a heading, one sentence about it and its content. */
export function DesignSection({ id, children }: { id: SectionId; children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24">
      <h2 id={`${id}-title`} className="text-2xl font-bold">
        {t(`design.${id}.title`)}
      </h2>
      <p className="mt-1 max-w-2xl text-muted">{t(`design.${id}.body`)}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

/** A framed example of one component: its name (as written in the code), what it is for, and the examples. */
export function ComponentDemo({
  name,
  description,
  wide = false,
  children,
}: {
  name: string;
  description: string;
  /** Takes the whole row instead of half of it. */
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn('min-w-0 rounded-card border border-border bg-surface p-5 shadow-card', wide && 'lg:col-span-2')}
    >
      <h3 className="font-bold">
        <code>{name}</code>
      </h3>
      <p className="mt-1 text-sm text-muted">{description}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

/** The grid that holds the ComponentDemo blocks of a section. */
export function DemoGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 lg:grid-cols-2">{children}</div>;
}
