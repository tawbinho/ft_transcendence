import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { PageHeader } from '@/components/PageHeader';
import { buttonClass, Card } from '@/components/ui';

/** The match does not exist, is full, or is reserved for someone else. */
export function Unavailable({ reason }: { reason?: string }) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title={t('online.unavailableTitle')} />
      <Card className="flex flex-col items-start gap-4">
        <p className="text-muted">{reason ?? t('online.unavailableBody')}</p>
        <Link to="/play/online" className={buttonClass()}>
          {t('online.newMatch')}
        </Link>
      </Card>
    </div>
  );
}
