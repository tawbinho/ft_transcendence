import { cn } from '@/lib/cn';

/** A grey pulsing block that stands where content will appear. Give it a size with `className`. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-lg bg-surface-2', className)} />;
}
