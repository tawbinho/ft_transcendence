import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { NAV_ITEMS } from '@/app/nav';
import { LogoMark } from '@/components/icons';
import { sessionOf } from '@/features/auth/session';
import { useCurrentUser } from '@/features/auth/hooks';
import { useUnreadCount } from '@/features/chat/hooks';
import { useIncomingRequestCount } from '@/features/friends/hooks';
import { DesktopNav } from './DesktopNav';
import { LanguageMenu } from './LanguageMenu';
import { MobileMenu } from './MobileMenu';
import { NavIconLink } from './NavLinks';
import { SessionActions } from './SessionActions';
import { ThemeToggle } from './ThemeToggle';

const chatLink = NAV_ITEMS.find((item) => item.count === 'chat');

/**
 * The top bar. On wide screens: the links, then chat and friends, theme,
 * language and the account. On phones: chat and a menu button.
 */
export function Header() {
  const { t } = useTranslation();
  const { data, isPending } = useCurrentUser();
  const session = sessionOf(data, isPending);
  const isMember = session.status === 'member';
  // Phones show Log in and Sign up in the bar itself instead of one tap away in the menu. To make
  // room (French and Arabic labels are long, screens go down to 320px) the name beside the logo is
  // hidden on phones while they are shown; the logo itself stays and the link keeps its name.
  const showPhoneAuth = session.status === 'visitor' || session.status === 'failed';
  const counts = { chat: useUnreadCount(isMember), friends: useIncomingRequestCount(isMember) };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/85 backdrop-blur supports-[backdrop-filter]:bg-surface/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4">
        <Link
          to="/"
          aria-label={t('app.name')}
          className="flex flex-none items-center gap-2 rounded-lg text-lg font-extrabold tracking-tight"
        >
          <LogoMark className="size-8" />
          <span className={showPhoneAuth ? 'hidden sm:inline' : undefined}>{t('app.name')}</span>
        </Link>

        <DesktopNav isMember={isMember} counts={counts} />

        <div className="hidden items-center gap-1 lg:flex">
          <ThemeToggle />
          <LanguageMenu />
          <div className="ms-1 flex items-center gap-2">
            <SessionActions session={session} />
          </div>
        </div>

        <div className="ms-auto flex items-center gap-1 lg:hidden">
          {isMember && chatLink && <NavIconLink item={chatLink} counts={counts} />}
          {showPhoneAuth && <SessionActions session={session} />}
          <MobileMenu session={session} counts={counts} />
        </div>
      </div>
    </header>
  );
}
