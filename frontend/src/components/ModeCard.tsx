import type { ReactNode } from 'react';
import { Link } from 'react-router';

/**
 * A card that presents one way to play or one section of the site.
 *
 * - With `to`, the whole card is a link (home page).
 * - With `children`, the card holds its own buttons (play and tournaments pages).
 */
export function ModeCard({
  icon,
  title,
  body,
  to,
  children,
  headingLevel,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  to?: string;
  children?: ReactNode;
  /** Defaults to 3 for a link card and 2 for a card with buttons. */
  headingLevel?: 2 | 3;
}) {
  const Heading = `h${headingLevel ?? (to ? 3 : 2)}` as 'h2' | 'h3';

  if (to) {
    return (
      <Link
        to={to}
        className="group flex flex-col gap-3 rounded-card border border-border bg-surface p-6 shadow-card transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-pop"
      >
        <span className="grid size-11 place-items-center rounded-xl bg-linear-to-br from-primary/25 to-primary/8 text-2xl text-primary">
          {icon}
        </span>
        <Heading className="text-lg font-bold group-hover:text-primary">{title}</Heading>
        <p className="text-muted">{body}</p>
      </Link>
    );
  }

  return (
    <section className="flex flex-col gap-4 rounded-card border border-border bg-surface p-6 shadow-card">
      <span className="grid size-12 place-items-center rounded-xl bg-linear-to-br from-primary/25 to-primary/8 text-2xl text-primary">
        {icon}
      </span>
      <div className="flex-1">
        <Heading className="text-xl font-bold">{title}</Heading>
        <p className="mt-1 text-muted">{body}</p>
      </div>
      {children}
    </section>
  );
}
