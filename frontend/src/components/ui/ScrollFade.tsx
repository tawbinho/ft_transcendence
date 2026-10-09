import { useRef, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { useScrollEdges } from '@/lib/useScrollEdges';

/**
 * A box that scrolls sideways and fades the edge that still has content hidden
 * behind it. It can take the keyboard focus, so the arrow keys scroll it.
 * The fade itself is the .scroll-fade class (styles/index.css); TabLinks uses
 * the same two parts for its row of tabs.
 */
export function ScrollFade({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const edges = useScrollEdges(box);

  return (
    <div
      ref={box}
      role="group"
      aria-label={label}
      tabIndex={0}
      className={cn(
        'scroll-fade max-w-full overflow-x-auto',
        edges.start && '[--fade-start:2.5rem]',
        edges.end && '[--fade-end:2.5rem]',
        className,
      )}
    >
      {children}
    </div>
  );
}
