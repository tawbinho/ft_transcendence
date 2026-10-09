import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { LogOutIcon, SlidersIcon, UserIcon } from '@/components/icons';
import { useLogout } from '@/features/auth/hooks';
import type { User } from '@/features/auth/types';
import { menuItemClass } from './menuStyles';

/** My profile, Settings and Log out: the list of the avatar menu, also used in the phone menu. */
export function AccountLinks({ user, before }: { user: User; before?: ReactNode }) {
  const { t } = useTranslation();
  const logout = useLogout();
  return (
    <ul className="flex flex-col gap-0.5">
      <li>
        <Link to={paths.profile(user.displayName)} className={menuItemClass}>
          <UserIcon />
          {t('nav.profile')}
        </Link>
      </li>
      {before}
      <li>
        <Link to={paths.settings()} className={menuItemClass}>
          <SlidersIcon />
          {t('nav.settings')}
        </Link>
      </li>
      <li>
        <button type="button" className={menuItemClass} disabled={logout.isPending} onClick={() => logout.mutate()}>
          <LogOutIcon />
          {t('nav.logout')}
        </button>
      </li>
    </ul>
  );
}
