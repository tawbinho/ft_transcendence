import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { Card } from '@/components/ui';
import { AvatarEditor } from '@/features/account/AvatarEditor';
import { DisplayNameForm } from '@/features/account/DisplayNameForm';
import type { User } from '@/features/auth/types';

/** What other players see of you: picture and display name. The email is only shown. */
export function ProfileSection({ user }: { user: User }) {
  const { t } = useTranslation();
  return (
    <Card className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">{t('account.profile')}</h2>
        <Link to={paths.profile(user.displayName)} className="text-sm font-semibold text-primary hover:underline">
          {t('account.viewProfile')}
        </Link>
      </div>
      <AvatarEditor user={user} />
      <DisplayNameForm user={user} />
      <div>
        <p className="text-sm font-semibold">{t('account.email')}</p>
        <p className="truncate text-muted">{user.email}</p>
      </div>
    </Card>
  );
}
