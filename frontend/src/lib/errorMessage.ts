import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { en } from '@/i18n/locales/en';
import { ApiError } from './api/errors';

type ErrorCode = Exclude<keyof typeof en.errors, 'title' | 'generic' | 'pageCrashed' | 'reload'>;

function isKnownCode(code: string): code is ErrorCode {
  return Object.hasOwn(en.errors, code) && !['title', 'generic', 'pageCrashed', 'reload'].includes(code);
}

/**
 * Turns any error into a sentence for the user: a translation when the code
 * is known, the server's own message otherwise, a generic sentence last.
 */
export function useErrorMessage(): (error: unknown) => string {
  const { t } = useTranslation();
  return useCallback(
    (error: unknown) => {
      if (error instanceof ApiError) {
        if (isKnownCode(error.code)) return t(`errors.${error.code}`);
        if (error.message) return error.message;
      }
      return t('errors.generic');
    },
    [t],
  );
}
