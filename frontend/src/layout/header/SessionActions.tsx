import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import type { Session } from '@/features/auth/session';
import { Button, Skeleton, buttonClass } from '@/components/ui';
import { AccountMenu } from './AccountMenu';

/**
 * The right end of the bar: the avatar menu for a member, Log in and Sign up
 * for a visitor. While the answer is on its way a grey circle stands in (no
 * flash of "Log in"); if it never came, a Retry button replaces both.
 */
export function SessionActions({
  session,
  onRetry,
  retrying,
}: {
  session: Session;
  onRetry: () => void;
  retrying: boolean;
}) {
  const { t } = useTranslation();

  if (session.status === 'member') return <AccountMenu user={session.user} />;
  if (session.status === 'loading') return <Skeleton className="size-9 rounded-full" />;
  if (session.status === 'failed') {
    return (
      <Button size="sm" variant="secondary" loading={retrying} onClick={onRetry}>
        {t('common.retry')}
        <span className="sr-only">. {t('nav.sessionError')}</span>
      </Button>
    );
  }
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
