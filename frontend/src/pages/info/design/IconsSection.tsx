import type { ComponentType, SVGProps } from 'react';
import * as icons from '@/components/icons';

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

// Every export called ...Icon (the plain `Icon` is the base they are all drawn with).
const ICONS = Object.entries(icons)
  .filter(([name]) => name.endsWith('Icon') && name !== 'Icon')
  .sort(([a], [b]) => a.localeCompare(b)) as [string, IconComponent][];

/** Every icon of the app, with the name to import it by. */
export function IconsSection() {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {ICONS.map(([name, Icon]) => (
        <li
          key={name}
          className="flex min-w-0 flex-col items-center gap-2 rounded-xl border border-border bg-surface p-3 text-center"
        >
          <Icon className="text-2xl" />
          <code dir="ltr" className="max-w-full break-words text-xs text-muted">
            {name}
          </code>
        </li>
      ))}
    </ul>
  );
}
