import type { ComponentType, SVGProps } from 'react';
import { ChatIcon, ClockIcon, EyeIcon, PlayIcon, TrophyIcon, UserPlusIcon, UsersIcon } from '@/components/icons';
import type { Messages } from '@/i18n/locales/en';

// The links of the top bar and of the phone menu, in one list, so the two menus
// and the "Log in to open Watch" hint always agree about where each page is.

/** The translation key of a link's name, for example 'nav.watch'. */
export type NavLabel = `nav.${keyof Messages['nav'] & string}`;

/** Which number shows next to a link. */
export type CountSource = 'chat' | 'friends';

/** The headings of the phone menu. */
export type NavGroup = 'play' | 'community' | 'you';

export interface NavItem {
  to: string;
  label: NavLabel;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  group: NavGroup;
  /** Only the icon is shown in the desktop bar; the label is read aloud. */
  iconOnly: boolean;
  /** Visitors see this link in the bar too. */
  forVisitors: boolean;
  /**
   * Whether the link is in the top bar and the phone menu. A page can stay reachable (route, other links,
   * the "Log in to open Watch" hint) while its link is out of the bars: set this to true to bring it back.
   */
  inMenus: boolean;
  /** The page needs an account: a visitor who follows the link is sent to the login page. */
  needsAccount: boolean;
  count?: CountSource;
  /** Whether the link is highlighted on this address. */
  isActive: (pathname: string) => boolean;
}

/** True for `base` itself and every address below it ("/play" and "/play/local", not "/playground"). */
function isUnder(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`);
}

export const NAV_ITEMS: NavItem[] = [
  {
    to: '/play',
    label: 'nav.play',
    icon: PlayIcon,
    group: 'play',
    iconOnly: false,
    forVisitors: true,
    inMenus: true,
    needsAccount: false,
    // A running online match belongs to Play; the list of matches (/matches) does not.
    isActive: (pathname) => isUnder(pathname, '/play') || pathname.startsWith('/matches/'),
  },
  {
    to: '/tournaments',
    label: 'nav.tournaments',
    icon: TrophyIcon,
    group: 'play',
    iconOnly: false,
    forVisitors: true,
    inMenus: true,
    needsAccount: false,
    isActive: (pathname) => isUnder(pathname, '/tournaments'),
  },
  {
    to: '/watch',
    label: 'nav.watch',
    icon: EyeIcon,
    group: 'play',
    iconOnly: false,
    forVisitors: true,
    inMenus: false,
    needsAccount: true,
    isActive: (pathname) => isUnder(pathname, '/watch'),
  },
  {
    to: '/players',
    label: 'nav.players',
    icon: UsersIcon,
    group: 'community',
    iconOnly: false,
    forVisitors: true,
    inMenus: false,
    needsAccount: true,
    isActive: (pathname) => ['/players', '/leaderboard', '/users'].some((base) => isUnder(pathname, base)),
  },
  {
    to: '/matches',
    label: 'nav.history',
    icon: ClockIcon,
    group: 'you',
    iconOnly: false,
    forVisitors: false,
    inMenus: true,
    needsAccount: true,
    isActive: (pathname) => pathname === '/matches' || pathname === '/matches/',
  },
  {
    to: '/chat',
    label: 'nav.chat',
    icon: ChatIcon,
    group: 'community',
    iconOnly: true,
    forVisitors: false,
    inMenus: true,
    needsAccount: true,
    count: 'chat',
    isActive: (pathname) => isUnder(pathname, '/chat'),
  },
  {
    to: '/friends',
    label: 'nav.friends',
    icon: UserPlusIcon,
    group: 'community',
    iconOnly: true,
    forVisitors: false,
    inMenus: true,
    needsAccount: true,
    count: 'friends',
    isActive: (pathname) => isUnder(pathname, '/friends'),
  },
];

/** The links of the bars shown to a visitor or to a member. */
export function navItemsFor(isMember: boolean): NavItem[] {
  return NAV_ITEMS.filter((item) => item.inMenus && (isMember || item.forVisitors));
}

/** The name of the section an address belongs to (for "Log in to open Watch."), or null. */
export function sectionForPath(pathname: string): NavLabel | null {
  return NAV_ITEMS.find((item) => item.isActive(pathname))?.label ?? null;
}

/** Whether any of the numbers is above zero (the dot on the phone menu button). */
export function hasAnyCount(counts: Record<CountSource, number>): boolean {
  return counts.chat + counts.friends > 0;
}

// The order of the links in the phone menu, group by group.
const MENU_ORDER: NavLabel[] = [
  'nav.play',
  'nav.tournaments',
  'nav.watch',
  'nav.players',
  'nav.friends',
  'nav.chat',
  'nav.history',
];

export const NAV_GROUPS: NavGroup[] = ['play', 'community', 'you'];

/** The links of one heading of the phone menu, in menu order. */
export function menuItems(group: NavGroup, isMember: boolean): NavItem[] {
  return navItemsFor(isMember)
    .filter((item) => item.group === group)
    .sort((a, b) => MENU_ORDER.indexOf(a.label) - MENU_ORDER.indexOf(b.label));
}
