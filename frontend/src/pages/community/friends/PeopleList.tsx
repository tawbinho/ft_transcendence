import type { ReactNode } from 'react';

/** A titled block of the friends page. */
export function Section({
  id,
  title,
  aside,
  children,
}: {
  id: string;
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id={id} className="text-xl font-bold">
          {title}
        </h2>
        {aside && <p className="text-sm text-muted">{aside}</p>}
      </div>
      {children}
    </section>
  );
}

/** A card with one row per person. */
export function PeopleList({ children }: { children: ReactNode }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">{children}</ul>
  );
}

/** A person on the left, their buttons on the right (underneath on a narrow screen). */
export function PersonRow({ children }: { children: ReactNode }) {
  return <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">{children}</li>;
}
