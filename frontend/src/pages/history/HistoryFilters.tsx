import { useTranslation } from 'react-i18next';
import { OptionGroup } from '@/components/ui';
import { FILTERS, type HistoryFilter } from './historyQuery';

/** Which matches the list shows: all of them, or only those in one state. */
export function HistoryFilters({
  value,
  onChange,
}: {
  value: HistoryFilter;
  onChange: (value: HistoryFilter) => void;
}) {
  const { t } = useTranslation();
  return (
    <OptionGroup
      legend={t('history.filterLabel')}
      value={value}
      onChange={onChange}
      options={FILTERS.map((filter) => ({ value: filter, label: t(`history.filters.${filter}`) }))}
    />
  );
}
