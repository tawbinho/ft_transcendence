import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '@/components/ui';
import { config } from '@/config';

/**
 * Says which pages run on the in-browser demo data (see src/config.ts), so
 * nobody mistakes made-up players for real ones. Hidden once the backend
 * serves every route.
 */
export function DemoBanner() {
  const { t, i18n } = useTranslation();
  const [confirming, setConfirming] = useState(false);
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
        <p className="min-w-0 flex-1">
          <strong>{t('demo.title')}</strong> {t('demo.body', { features })}
        </p>
        <button
          type="button"
          className="font-semibold text-primary hover:underline"
          onClick={() => setConfirming(true)}
        >
          {t('demo.reset')}
        </button>
      </div>
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
