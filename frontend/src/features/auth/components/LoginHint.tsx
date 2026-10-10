import { useTranslation } from 'react-i18next';
import { Alert } from '@/components/ui';
import type { LoginHint as Hint } from '../loginHint';

/** One line above the login form: why the visitor was sent here. */
export function LoginHint({ hint }: { hint: Hint }) {
  const { t } = useTranslation();
  return (
    <Alert tone="info">
      {hint.kind === 'section' ? t('auth.hintSection', { section: t(hint.section) }) : t('auth.hintGeneric')}
    </Alert>
  );
}
