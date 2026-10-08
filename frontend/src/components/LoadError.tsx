import { useTranslation } from 'react-i18next';
import { Alert, Button } from '@/components/ui';
import { useErrorMessage } from '@/lib/errorMessage';

/** Data that could not be loaded: the reason, and a button to try again. */
export function LoadError({
  error,
  onRetry,
  retrying = false,
  className,
}: {
  error: unknown;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  return (
    <Alert
      tone="danger"
      className={className}
      action={
        onRetry && (
          <Button size="sm" variant="secondary" loading={retrying} onClick={onRetry}>
            {t('common.retry')}
          </Button>
        )
      }
    >
      {errorMessage(error)}
    </Alert>
  );
}
