import { useTranslation } from 'react-i18next';
import { OptionGroup } from '@/components/ui';
import { TOURNAMENT_FILTERS, type TournamentFilter } from '@/features/tournaments/view';

/** Choose which tournaments the list shows: all, open, in progress or finished. */
export function TournamentFilters({
  value,
  onChange,
}: {
  value: TournamentFilter;
  onChange: (filter: TournamentFilter) => void;
}) {
  const { t } = useTranslation();
  return (
    <OptionGroup
      legend={t('tournaments.filterLabel')}
      value={value}
      onChange={onChange}
      options={TOURNAMENT_FILTERS.map((filter) => ({ value: filter, label: t(`tournaments.filters.${filter}`) }))}
    />
  );
}
