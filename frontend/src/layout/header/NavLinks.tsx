import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';
import { IconButton } from '@/components/ui';
import type { CountSource, NavItem } from '@/app/nav';
import { cn } from '@/lib/cn';
import { CountBadge } from './CountBadge';

export type Counts = Record<CountSource, number>;

/** A text link of the desktop bar or the phone menu; the page you are on is highlighted. */
export function NavTextLink({ item, counts, menu = false }: { item: NavItem; counts: Counts; menu?: boolean }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const active = item.isActive(pathname);
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center rounded-lg px-3 font-semibold transition',
        // In the phone menu the icon gap matches the account links under them (menuItemClass).
        menu ? 'h-11 gap-3' : 'h-10 gap-2',
        active ? 'bg-primary/12 text-primary' : cn('hover:bg-surface-2 hover:text-fg', menu ? 'text-fg' : 'text-muted'),
      )}
    >
      {menu && <Icon className="flex-none" />}
      {t(item.label)}
      {item.count && <CountBadge count={counts[item.count]} />}
    </Link>
  );
}

/** A link that only shows an icon (chat, friends), with its count on the corner. */
export function NavIconLink({ item, counts }: { item: NavItem; counts: Counts }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const active = item.isActive(pathname);
  const Icon = item.icon;
  const count = item.count ? counts[item.count] : 0;
  const name = t(item.label);
  return (
    <IconButton
      to={item.to}
      label={count > 0 ? `${name}, ${t('nav.newCount', { count })}` : name}
      aria-current={active ? 'page' : undefined}
      className={cn(active && 'bg-primary/12 text-primary')}
    >
      <Icon />
      <CountBadge count={count} announce={false} className="absolute -end-0.5 -top-0.5" />
    </IconButton>
  );
}
