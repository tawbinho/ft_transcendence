import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import { NAV_GROUPS, hasAnyCount, menuItems, type NavGroup } from '@/app/nav';
import { CloseIcon, MenuIcon } from '@/components/icons';
import { IconButton } from '@/components/ui';
import type { Session } from '@/features/auth/session';
import { ColorSchemePicker } from '../ColorSchemePicker';
import { LanguagePicker } from '../LanguagePicker';
import { AccountLinks } from './AccountLinks';
import { NavTextLink, type Counts } from './NavLinks';
import { SessionActions } from './SessionActions';
import { useDismiss } from './useDismiss';

const GROUP_LABELS = {
  play: 'nav.groupPlay',
  community: 'nav.groupCommunity',
  you: 'nav.groupYou',
} as const satisfies Record<NavGroup, `nav.${string}`>;

/**
 * The menu button of the phone bar and the panel under it: links in three
 * groups (Play, Community, You), then language and appearance. A dot on the
 * button tells that chat or friends have something new.
 */
export function MobileMenu({
  session,
  counts,
  onRetry,
  retrying,
}: {
  session: Session;
  counts: Counts;
  onRetry: () => void;
  retrying: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const root = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const close = useCallback(() => setOpen(false), []);
  // The button also tells that something is new (the dot is only for the eyes).
  const total = counts.chat + counts.friends;
  const openLabel = total > 0 ? `${t('nav.openMenu')}, ${t('nav.newCount', { count: total })}` : t('nav.openMenu');

  // Going to another page closes the menu.
  useEffect(close, [pathname, close]);
  useDismiss(open, root, close);

  return (
    // "contents" lets the button sit in the bar while the panel hangs below the whole header.
    <div ref={root} className="contents">
      <IconButton
        label={open ? t('nav.closeMenu') : openLabel}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <CloseIcon /> : <MenuIcon />}
        {!open && hasAnyCount(counts) && (
          <span aria-hidden="true" className="absolute end-2 top-2 size-2.5 rounded-full bg-danger" />
        )}
      </IconButton>

      {open && (
        // A dim layer over the page under the bar. Tapping it closes the menu. It sits behind
        // the panel (-z-10, inside the header) and is only as tall as the screen under the bar.
        <div
          aria-hidden="true"
          data-testid="menu-backdrop"
          onClick={close}
          className="absolute inset-x-0 top-full -z-10 h-[calc(100dvh-4rem)] bg-black/40 dark:bg-black/60"
        />
      )}

      {open && (
        <div
          id={panelId}
          className="absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-border bg-surface px-4 pb-4 shadow-lg"
        >
          <nav aria-label={t('nav.main')}>
            {NAV_GROUPS.map((group) => (
              <MenuGroup
                key={group}
                group={group}
                session={session}
                counts={counts}
                onRetry={onRetry}
                retrying={retrying}
              />
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-4 border-t border-border px-3 pt-4">
            <LanguagePicker />
            <ColorSchemePicker />
          </div>
        </div>
      )}
    </div>
  );
}

function MenuGroup({
  group,
  session,
  counts,
  onRetry,
  retrying,
}: {
  group: NavGroup;
  session: Session;
  counts: Counts;
  onRetry: () => void;
  retrying: boolean;
}) {
  const { t } = useTranslation();
  const headingId = useId();
  const items = menuItems(group, session.status === 'member');
  if (group !== 'you' && items.length === 0) return null;

  const links = items.map((item) => (
    <li key={item.to}>
      <NavTextLink item={item} counts={counts} menu />
    </li>
  ));

  return (
    <div role="group" aria-labelledby={headingId}>
      <p id={headingId} className="px-3 pb-1 pt-4 text-xs font-bold uppercase tracking-wide text-muted">
        {t(GROUP_LABELS[group])}
      </p>
      {group === 'you' && session.status === 'member' ? (
        // My profile, History, Settings, Log out
        <AccountLinks user={session.user} before={links} />
      ) : group === 'you' ? (
        <div className="flex gap-2 px-3 py-1">
          <SessionActions session={session} onRetry={onRetry} retrying={retrying} />
        </div>
      ) : (
        <ul className="flex flex-col gap-0.5">{links}</ul>
      )}
    </div>
  );
}
