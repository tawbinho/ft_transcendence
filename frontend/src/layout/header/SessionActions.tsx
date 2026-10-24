import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import type { Session } from '@/features/auth/session';
import { Skeleton, buttonClass } from '@/components/ui';
import { AccountMenu } from './AccountMenu';

/**
 * The right end of the bar: the avatar menu for a member, Log in and Sign up for a visitor. While
 * the answer is on its way a grey circle stands in (no flash of "Log in").
 */
export function SessionActions({ session }: { session: Session }) {
  const { t } = useTranslation();

  if (session.status === 'member') return <AccountMenu user={session.user} />;
  if (session.status === 'loading') return <Skeleton className="size-9 rounded-full" />;
  return (
    <>
      <Link to="/login" className={buttonClass({ variant: 'ghost', size: 'sm' })}>
        {t('nav.login')}
      </Link>
      <Link to="/signup" className={buttonClass({ size: 'sm' })}>
        {t('nav.signup')}
      </Link>
    </>
  );
}
