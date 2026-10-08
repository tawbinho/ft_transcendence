import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, useLocation } from 'react-router';
import { CloseIcon, LogoMark, MenuIcon } from '@/components/icons';
import { buttonClass } from '@/components/ui';
import { useCurrentUser } from '@/features/auth/hooks';
import { useUnreadCount } from '@/features/chat/hooks';
import { useIncomingRequestCount } from '@/features/friends/hooks';
import type { Messages } from '@/i18n/locales/en';
import { cn } from '@/lib/cn';
import { LanguageSelect } from './LanguageSelect';
import { AccountLinks, UserMenu } from './UserMenu';

interface NavItem {
  to: string;
  label: `nav.${keyof Messages['nav'] & string}`;
  /** Shown to visitors too (the other links need an account). */
  public?: boolean;
  badge?: 'friends' | 'chat';
}

const NAV: NavItem[] = [
  { to: '/play', label: 'nav.play', public: true },
  { to: '/tournaments', label: 'nav.tournaments', public: true },
  { to: '/watch', label: 'nav.watch' },
  { to: '/players', label: 'nav.players' },
  { to: '/friends', label: 'nav.friends', badge: 'friends' },
  { to: '/chat', label: 'nav.chat', badge: 'chat' },
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-2 rounded-lg px-3 py-2 font-semibold transition',
    isActive ? 'bg-primary/12 text-primary' : 'text-muted hover:bg-surface-2 hover:text-fg',
  );

/** A number on a menu link; screen readers hear "Chat, new: 3". */
function CountBadge({ count }: { count: number }) {
  const { t } = useTranslation();
  if (count === 0) return null;
  return (
    <>
      <span
        aria-hidden="true"
        className="grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1.5 text-xs font-bold text-white"
      >
        {count > 99 ? '99+' : count}
      </span>
      <span className="sr-only">, {t('nav.newCount', { count })}</span>
    </>
  );
}

export function Header() {
  const { t } = useTranslation();
  const { data: user } = useCurrentUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const unread = useUnreadCount(Boolean(user));
  const requests = useIncomingRequestCount(Boolean(user));
  const counts = { chat: unread, friends: requests };

  // A new page closes the mobile menu.
  useEffect(() => setMenuOpen(false), [pathname]);

  const links = NAV.filter((item) => user || item.public).map((item) => (
    <NavLink key={item.to} to={item.to} className={navLinkClass}>
      {t(item.label)}
      {item.badge && <CountBadge count={counts[item.badge]} />}
    </NavLink>
  ));

  const guestActions = (
    <>
      <Link to="/login" className={buttonClass({ variant: 'ghost', size: 'sm' })}>
        {t('nav.login')}
      </Link>
      <Link to="/signup" className={buttonClass({ size: 'sm' })}>
        {t('nav.signup')}
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/85 backdrop-blur supports-[backdrop-filter]:bg-surface/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link to="/" className="flex flex-none items-center gap-2 rounded-lg text-lg font-extrabold tracking-tight">
          <LogoMark className="size-8" />
          <span>{t('app.name')}</span>
        </Link>

        <nav aria-label={t('nav.main')} className="ms-4 hidden items-center gap-1 lg:flex">
          {links}
        </nav>

        <div className="ms-auto hidden items-center gap-2 lg:flex">
          <LanguageSelect />
          {user ? <UserMenu user={user} /> : guestActions}
        </div>

        <button
          type="button"
          className="relative ms-auto grid size-10 place-items-center rounded-lg text-2xl hover:bg-surface-2 lg:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
          {!menuOpen && unread + requests > 0 && (
            <span aria-hidden="true" className="absolute end-1.5 top-1.5 size-2.5 rounded-full bg-danger" />
          )}
        </button>
      </div>

      {menuOpen && (
        <div
          id="mobile-menu"
          className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-border bg-surface px-4 pb-4 lg:hidden"
        >
          <nav aria-label={t('nav.main')} className="flex flex-col gap-1 py-3">
            {links}
          </nav>
          <div className="flex flex-col gap-3 border-t border-border pt-3">
            {user ? (
              <>
                <p className="px-3 text-sm text-muted">{user.displayName}</p>
                <AccountLinks user={user} />
              </>
            ) : (
              <div className="flex flex-wrap gap-2">{guestActions}</div>
            )}
            <LanguageSelect showLabel className="px-3" />
          </div>
        </div>
      )}
    </header>
  );
}
