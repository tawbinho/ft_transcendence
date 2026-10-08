import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/** Sets the browser tab title to "<title> · <app name>". */
export function useDocumentTitle(title?: string): void {
  const { t } = useTranslation();
  const appName = t('app.name');
  useEffect(() => {
    document.title = title ? `${title} · ${appName}` : appName;
  }, [title, appName]);
}
