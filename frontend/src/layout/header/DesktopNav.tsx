import { useTranslation } from 'react-i18next';
import { navItemsFor } from '@/app/nav';
import { NavIconLink, NavTextLink, type Counts } from './NavLinks';

/** The links of the bar on wide screens: text links, then the icon links (chat, friends) on the far side. */
export function DesktopNav({ isMember, counts }: { isMember: boolean; counts: Counts }) {
  const { t } = useTranslation();
  const items = navItemsFor(isMember);
  return (
    <nav aria-label={t('nav.main')} className="hidden min-w-0 flex-1 items-center gap-1 lg:flex">
      {items
        .filter((item) => !item.iconOnly)
        .map((item) => (
          <NavTextLink key={item.to} item={item} counts={counts} />
        ))}
      <div className="ms-auto flex items-center">
        {items
          .filter((item) => item.iconOnly)
          .map((item) => (
            <NavIconLink key={item.to} item={item} counts={counts} />
          ))}
      </div>
    </nav>
  );
}
