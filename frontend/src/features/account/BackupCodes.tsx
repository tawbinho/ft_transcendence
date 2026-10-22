import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckIcon, CopyIcon } from '@/components/icons';
import { Alert, Button } from '@/components/ui';

/**
 * The 10 one-time backup codes, shown once, right after 2FA is turned on.
 * Each one can replace a code from the app a single time (a lost phone); the
 * server keeps only their hash, so they cannot be shown again.
 */
export function BackupCodes({ codes, onDone }: { codes: string[]; onDone: () => void }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(codes.join('\n'));
      setCopied(true);
    } catch {
      // No clipboard access: the codes stay on screen to be written down.
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Alert tone="warning" title={t('twoFactor.backupTitle')}>
        {t('twoFactor.backupBody')}
      </Alert>
      <ul dir="ltr" className="grid max-w-xs grid-cols-2 gap-2 font-mono">
        {codes.map((code) => (
          <li key={code} className="rounded-lg bg-surface-2 px-2 py-1 text-center">
            {code}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => void copy()} aria-live="polite">
          {copied ? <CheckIcon /> : <CopyIcon />}
          {copied ? t('common.copied') : t('common.copy')}
        </Button>
        <Button onClick={onDone}>{t('twoFactor.backupDone')}</Button>
      </div>
    </div>
  );
}
