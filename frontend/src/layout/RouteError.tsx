import { useTranslation } from 'react-i18next';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router';
import { buttonClass } from '@/components/ui';
import { NotFoundPage } from '@/pages/NotFoundPage';

/** Shown instead of a page that failed to load or crashed while rendering. */
export function RouteError() {
  const { t } = useTranslation();
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />;

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-2xl font-bold">{t('errors.title')}</h1>
      <p className="text-muted">{t('errors.pageCrashed')}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" className={buttonClass()} onClick={() => window.location.reload()}>
          {t('errors.reload')}
        </button>
        <Link to="/" className={buttonClass({ variant: 'secondary' })}>
          {t('notFound.home')}
        </Link>
      </div>
    </div>
  );
}
