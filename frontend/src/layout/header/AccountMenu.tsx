import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import { ChevronDownIcon } from '@/components/icons';
import { Avatar } from '@/components/ui';
import type { User } from '@/features/auth/types';
import { cn } from '@/lib/cn';
import { AccountLinks } from './AccountLinks';
import { menuPanelClass } from './menuStyles';
import { useDismiss } from './useDismiss';

/**
 * The avatar button of the header and the list of account links it opens. A
 * plain disclosure (a button and a list of links): Tab moves through the links,
 * Escape or a click outside closes it.
 */
export function AccountMenu({ user }: { user: User }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const root = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const close = useCallback(() => setOpen(false), []);

  // Following a link closes the menu.
  useEffect(close, [pathname, close]);
  useDismiss(open, root, close);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 items-center gap-2 rounded-full ps-1.5 pe-2 font-semibold hover:bg-surface-2"
      >
        <Avatar user={user} size="sm" />
        <span className="hidden max-w-[9rem] truncate xl:inline">{user.displayName}</span>
        <span className="sr-only xl:hidden">{user.displayName}</span>
        <span className="sr-only">{t('nav.accountMenu')}</span>
        <ChevronDownIcon className={cn('text-muted transition', open && 'rotate-180')} />
      </button>
      <div id={panelId} hidden={!open} className={menuPanelClass}>
        <AccountLinks user={user} />
      </div>
    </div>
  );
}
