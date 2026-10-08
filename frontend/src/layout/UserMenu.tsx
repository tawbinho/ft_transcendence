import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';
import { paths } from '@/app/paths';
import { ChevronDownIcon, ClockIcon, LogOutIcon, SlidersIcon, UserIcon } from '@/components/icons';
import { Avatar } from '@/components/ui';
import { useLogout } from '@/features/auth/hooks';
import type { User } from '@/features/auth/types';
import { cn } from '@/lib/cn';

const itemClass =
  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-start font-semibold text-fg hover:bg-surface-2 [&>svg]:text-muted';

/** The links of the account menu, shared by the dropdown and the mobile menu. */
export function AccountLinks({ user, className }: { user: User; className?: string }) {
  const { t } = useTranslation();
  const logout = useLogout();
  return (
    <ul className={cn('flex flex-col gap-0.5', className)}>
      <li>
        <Link to={paths.profile(user.displayName)} className={itemClass}>
          <UserIcon />
          {t('nav.profile')}
        </Link>
      </li>
      <li>
        <Link to="/matches" className={itemClass}>
          <ClockIcon />
          {t('nav.matches')}
        </Link>
      </li>
      <li>
        <Link to="/account" className={itemClass}>
          <SlidersIcon />
          {t('nav.account')}
        </Link>
      </li>
      <li>
        <button type="button" className={itemClass} disabled={logout.isPending} onClick={() => logout.mutate()}>
          <LogOutIcon />
          {t('nav.logout')}
        </button>
      </li>
    </ul>
  );
}

/**
 * The avatar button in the header and the account links it shows. A simple
 * disclosure (button + list of links): Tab moves through the links, Escape
 * or a click outside closes it.
 */
export function UserMenu({ user }: { user: User }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  // Following a link closes the menu.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      button.current?.focus();
    };
    const onFocusIn = (event: FocusEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('focusin', onFocusIn);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full py-1 ps-1 pe-2 font-semibold hover:bg-surface-2"
      >
        <Avatar user={user} size="sm" />
        <span className="hidden max-w-[10rem] truncate xl:inline">{user.displayName}</span>
        <span className="sr-only xl:hidden">{user.displayName}</span>
        <span className="sr-only">{t('nav.accountMenu')}</span>
        <ChevronDownIcon className={cn('text-muted transition', open && 'rotate-180')} />
      </button>
      <div
        id={panelId}
        hidden={!open}
        className="absolute end-0 top-full z-40 mt-2 w-56 rounded-xl border border-border bg-surface p-1.5 shadow-lg"
      >
        <AccountLinks user={user} />
      </div>
    </div>
  );
}
