import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckIcon, CopyIcon } from '@/components/icons';
import { Button } from '@/components/ui';

/** A read-only link with a copy button. */
export function ShareLink({ url }: { url: string }) {
  const { t } = useTranslation();
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // No clipboard access: select the text so it can be copied by hand.
      input.current?.select();
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {t('online.shareLink')}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          ref={input}
          readOnly
          value={url}
          dir="ltr"
          onFocus={(event) => event.target.select()}
          className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-surface-2 px-3 font-mono text-sm text-fg"
        />
        <Button variant="secondary" onClick={() => void copy()} aria-live="polite">
          {copied ? <CheckIcon /> : <CopyIcon />}
          {copied ? t('common.copied') : t('common.copy')}
        </Button>
      </div>
    </div>
  );
}
