import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';

const COOLDOWN_SECONDS = 30;

/** "Send a new code" that waits 30 seconds between sends (a code was just sent). */
export function ResendCode({ onResend, loading }: { onResend: () => void; loading?: boolean }) {
  const { t } = useTranslation();
  const [left, setLeft] = useState(COOLDOWN_SECONDS);

  useEffect(() => {
    if (left <= 0) return;
    const timer = setTimeout(() => setLeft((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [left]);

  return (
    <Button
      variant="ghost"
      disabled={left > 0}
      loading={loading}
      onClick={() => {
        onResend();
        setLeft(COOLDOWN_SECONDS);
      }}
    >
      {left > 0 ? t('auth.resendIn', { seconds: left }) : t('auth.resendCode')}
    </Button>
  );
}
