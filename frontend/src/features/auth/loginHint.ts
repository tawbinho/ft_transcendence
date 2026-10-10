import { sectionForPath, type NavLabel } from '@/app/nav';

/** What the login page tells a visitor who was sent there from another page. */
export type LoginHint = { kind: 'section'; section: NavLabel } | { kind: 'generic' };

/**
 * `returnTo` is the page the visitor wanted (see `returnPath` in app/guards.tsx),
 * or null when they opened the login page themselves: then there is no hint.
 */
export function loginHint(returnTo: string | null): LoginHint | null {
  if (returnTo === null) return null;
  const pathname = returnTo.split(/[?#]/)[0] ?? '';
  const section = sectionForPath(pathname);
  return section ? { kind: 'section', section } : { kind: 'generic' };
}
