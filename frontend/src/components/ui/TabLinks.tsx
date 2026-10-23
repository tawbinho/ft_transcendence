import { useEffect, useRef, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router';
import { cn } from '@/lib/cn';

export interface TabLink {
  to: string;
  label: ReactNode;
  /** A small number after the label, for example unread messages. Hidden when 0 or missing. */
  count?: number;
  /** Only active on exactly this URL (not on the pages below it). */
  end?: boolean;
}

/**
 * Links that look like tabs and switch between pages. The current one gets
 * aria-current="page". On a narrow screen the row scrolls sideways inside
 * itself, so the page never does, and starts with the current tab in view.
 */
export function TabLinks({ label, tabs, className }: { label: string; tabs: readonly TabLink[]; className?: string }) {
  const nav = useRef<HTMLElement>(null);
  const { pathname } = useLocation();

  // Bring the current tab into view when the page or the row changes.
  useEffect(() => {
    const row = nav.current;
    const current = row?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!row || !current) return;
    const rowBox = row.getBoundingClientRect();
    const tabBox = current.getBoundingClientRect();
    // scrollLeft grows to the right in every direction, so one rule serves both.
    if (tabBox.left < rowBox.left) row.scrollLeft += tabBox.left - rowBox.left;
    else if (tabBox.right > rowBox.right) row.scrollLeft += tabBox.right - rowBox.right;
  }, [pathname]);

  return (
    <nav ref={nav} aria-label={label} className={cn('max-w-full overflow-x-auto', className)}>
      <ul className="flex w-max min-w-full gap-1 border-b border-border">
        {tabs.map((tab) => (
          <li key={tab.to}>
            <NavLink
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  '-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-2 py-2.5 text-sm font-semibold transition sm:px-4 sm:text-base',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted hover:border-border hover:text-fg',
                )
              }
            >
              {tab.label}
              {tab.count ? (
                <span className="rounded-full bg-primary/12 px-2 text-xs font-bold tabular-nums text-primary">
                  {tab.count}
                </span>
              ) : null}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
