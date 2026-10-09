import { useTranslation } from 'react-i18next';
import { OptionGroup, SelectField } from '@/components/ui';
import { FILTERS, isFilter, type HistoryFilter } from './historyQuery';

/**
 * Which matches the list shows: all of them, or only those in one state.
 * Five options do not fit side by side on a phone, so there they are a drop-down list.
 */
export function HistoryFilters({
  value,
  onChange,
}: {
  value: HistoryFilter;
  onChange: (value: HistoryFilter) => void;
}) {
  const { t } = useTranslation();
  const options = FILTERS.map((filter) => ({ value: filter, label: t(`history.filters.${filter}`) }));
  return (
    <>
      <SelectField
        label={t('history.filterLabel')}
        value={value}
        onChange={(event) => isFilter(event.target.value) && onChange(event.target.value)}
        className="sm:hidden"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectField>
      <OptionGroup
        legend={t('history.filterLabel')}
        value={value}
        onChange={onChange}
        options={options}
        className="hidden sm:flex"
      />
    </>
  );
}
