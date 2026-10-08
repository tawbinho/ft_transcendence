import type { ReactNode } from 'react';

/** A keyboard key, for example in "press Enter to drop the disc". */
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded-md border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-xs font-semibold text-fg">
      {children}
    </kbd>
  );
}
