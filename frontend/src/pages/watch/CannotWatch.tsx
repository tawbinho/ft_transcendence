import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { PageHeader } from '@/components/PageHeader';
import { buttonClass, Card } from '@/components/ui';

/** Shown when the address is not a match, or the match does not exist or cannot be seen. */
export function CannotWatch() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title={t('watch.unavailableTitle')} />
      <Card className="flex flex-col items-start gap-4">
        <p className="text-muted">{t('watch.unavailableBody')}</p>
        <Link to="/watch" className={buttonClass()}>
          {t('watch.backToLive')}
        </Link>
      </Card>
    </div>
  );
}
