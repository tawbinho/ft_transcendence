import { useTranslation } from 'react-i18next';
import { Alert } from '@/components/ui';

/** One line above the login form for a visitor who was sent here from another page. */
export function LoginHint() {
  const { t } = useTranslation();
  return <Alert tone="info">{t('auth.hintGeneric')}</Alert>;
}
