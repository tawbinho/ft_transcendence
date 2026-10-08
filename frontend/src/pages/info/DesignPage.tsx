import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';

/** The design system: colors, type and components. Only the page exists for now. */
export function DesignPage() {
  const { t } = useTranslation();
  return <PageHeader title={t('design.title')} subtitle={t('design.soon')} />;
}
