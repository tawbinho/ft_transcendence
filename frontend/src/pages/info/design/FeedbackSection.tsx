import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LoadError } from '@/components/LoadError';
import {
  Alert,
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  ProgressBar,
  Skeleton,
  Spinner,
  type BadgeTone,
} from '@/components/ui';
import { ComponentDemo, DemoGrid } from './DesignSection';

const TONES = ['info', 'success', 'warning', 'danger'] as const;
const BADGE_TONES: BadgeTone[] = ['neutral', ...TONES];

/** Everything that tells the user what is happening: messages, labels, loading, empty and error states, questions. */
export function FeedbackSection() {
  const { t } = useTranslation();
  const [asking, setAsking] = useState(false);

  return (
    <DemoGrid>
      <ComponentDemo wide name="Alert" description={t('design.feedback.alert')}>
        <div className="grid w-full gap-3 sm:grid-cols-2">
          {TONES.map((tone) => (
            <Alert key={tone} tone={tone} title={t(`design.sample.${tone}`)}>
              {t('design.sample.message')}
            </Alert>
          ))}
        </div>
      </ComponentDemo>

      <ComponentDemo name="Badge" description={t('design.feedback.badge')}>
        {BADGE_TONES.map((tone) => (
          <Badge key={tone} tone={tone}>
            {t(`design.sample.${tone}`)}
          </Badge>
        ))}
      </ComponentDemo>

      <ComponentDemo name="Spinner · Skeleton · ProgressBar" description={t('design.feedback.loading')}>
        <Spinner className="text-primary" />
        <div className="flex w-full flex-col gap-3">
          <Skeleton className="h-4 w-2/3" />
          <ProgressBar value={60} label={t('design.sample.progress')} />
        </div>
      </ComponentDemo>

      <ComponentDemo wide name="EmptyState" description={t('design.feedback.emptyState')}>
        <div className="grid w-full gap-4 sm:grid-cols-2">
          <EmptyState>{t('design.sample.empty')}</EmptyState>
          <EmptyState illustration="trophy" action={<Button variant="secondary">{t('design.sample.primary')}</Button>}>
            {t('design.sample.empty')}
          </EmptyState>
        </div>
      </ComponentDemo>

      <ComponentDemo name="LoadError" description={t('design.feedback.loadError')}>
        <LoadError className="w-full" error={new Error('demo')} onRetry={() => {}} />
      </ComponentDemo>

      <ComponentDemo name="ConfirmDialog" description={t('design.feedback.confirmDialog')}>
        <Button variant="secondary" onClick={() => setAsking(true)}>
          {t('design.sample.openDialog')}
        </Button>
        <ConfirmDialog
          open={asking}
          title={t('design.sample.dialogTitle')}
          confirmLabel={t('design.sample.danger')}
          confirmVariant="danger"
          onConfirm={() => setAsking(false)}
          onClose={() => setAsking(false)}
        >
          {t('design.sample.dialogBody')}
        </ConfirmDialog>
      </ComponentDemo>
    </DemoGrid>
  );
}
