import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon } from '@/components/icons';
import { ConfirmDialog } from '@/components/ui';
import { config } from '@/config';
import { cn } from '@/lib/cn';

/**
 * Says that some pages run on the in-browser demo data (see src/config.ts), so
 * nobody mistakes made-up players for real ones. One line; the list of which
 * parts opens under "Details". Hidden once the backend serves every route.
 */
export function DemoBanner() {
  const { t, i18n } = useTranslation();
  const [confirming, setConfirming] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const detailsId = useId();
  if (config.demoFeatures.size === 0) return null;

  const features = new Intl.ListFormat(i18n.language, { type: 'conjunction' }).format(
    [...config.demoFeatures].map((feature) => t(`demo.features.${feature}`)),
  );

  async function reset() {
    // Already loaded by main.tsx: this import costs nothing.
    const { resetDemoData } = await import('@/demo');
    resetDemoData();
    window.location.reload();
  }

  return (
    <div className="border-b border-warning/30 bg-warning-soft">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-sm">
        <p className="min-w-0 flex-1 font-semibold">{t('demo.short')}</p>
        <button
          type="button"
          aria-expanded={showDetails}
          aria-controls={detailsId}
          className="inline-flex min-h-6 items-center gap-1 font-semibold text-primary hover:underline"
          onClick={() => setShowDetails((open) => !open)}
        >
          {t('demo.details')}
          <ChevronDownIcon className={cn('transition', showDetails && 'rotate-180')} />
        </button>
        <button
          type="button"
          className="inline-flex min-h-6 items-center font-semibold text-primary hover:underline"
          onClick={() => setConfirming(true)}
        >
          {t('demo.reset')}
        </button>
      </div>
      <p id={detailsId} hidden={!showDetails} className="mx-auto max-w-6xl px-4 pb-2 text-sm">
        {t('demo.body', { features })}
      </p>
      <ConfirmDialog
        open={confirming}
        title={t('demo.resetTitle')}
        confirmLabel={t('demo.reset')}
        confirmVariant="danger"
        onClose={() => setConfirming(false)}
        onConfirm={() => void reset()}
      >
        {t('demo.resetBody')}
      </ConfirmDialog>
    </div>
  );
}
