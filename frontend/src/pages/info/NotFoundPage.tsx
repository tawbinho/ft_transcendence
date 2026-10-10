import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { NotFoundIllustration } from '@/components/illustrations';
import { buttonClass } from '@/components/ui';
import { useDocumentTitle } from '@/lib/useDocumentTitle';

export function NotFoundPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('notFound.title'));
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-12 text-center sm:py-16">
      <NotFoundIllustration className="h-36 w-auto" />
      <h1 className="text-2xl font-bold">{t('notFound.title')}</h1>
      <p className="text-muted">{t('notFound.body')}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Link to="/" className={buttonClass()}>
          {t('notFound.home')}
        </Link>
        <Link to="/play" className={buttonClass({ variant: 'secondary' })}>
          {t('notFound.play')}
        </Link>
      </div>
    </div>
  );
}
