import { cn } from '@/lib/cn';

/** Numbers with their labels, as a grid of tiles (read as label, then value). */
export function StatTiles({
  tiles,
  className,
}: {
  tiles: readonly [label: string, value: string][];
  className?: string;
}) {
  return (
    <dl className={cn('grid grid-cols-2 gap-3 sm:grid-cols-4', className)}>
      {tiles.map(([label, value]) => (
        <div key={label} className="flex flex-col-reverse gap-1 rounded-xl border border-border bg-surface p-4">
          <dt className="text-sm text-muted">{label}</dt>
          <dd className="text-2xl font-extrabold tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
