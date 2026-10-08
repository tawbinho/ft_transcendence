import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { buttonClass } from '@/components/ui';
import { useDocumentTitle } from '@/lib/useDocumentTitle';

export function NotFoundPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('notFound.title'));
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-16 text-center">
      <p className="text-6xl font-extrabold text-primary" aria-hidden="true">
        404
      </p>
      <h1 className="text-2xl font-bold">{t('notFound.title')}</h1>
      <p className="text-muted">{t('notFound.body')}</p>
      <Link to="/" className={buttonClass()}>
        {t('notFound.home')}
      </Link>
    </div>
  );
}
