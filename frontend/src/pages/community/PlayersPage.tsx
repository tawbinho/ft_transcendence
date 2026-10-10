import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { useUrlParams } from '@/lib/useUrlParams';
import { CommunityTabs } from './CommunityTabs';
import { PlayerFilters } from './players/PlayerFilters';
import { readFilters, writeFilters, type PlayerFilters as Filters } from './players/playerFilters';
import { PlayerResults } from './players/PlayerResults';

/** Player search with filters, sorting and pages. The filters live in the URL, so a search can be shared. */
export function PlayersPage() {
  const { t } = useTranslation();
  const [params, setParams] = useUrlParams();
  const filters = readFilters(params);

  /** Changes some filters; any change of filter goes back to page 1 (unless it is the page itself). */
  function update(changes: Partial<Filters>) {
    setParams(writeFilters({ ...filters, page: 1, ...changes }));
  }

  return (
    <>
      <PageHeader title={t('players.title')} subtitle={t('players.subtitle')} className="mb-4" />
      <CommunityTabs />
      <PlayerFilters filters={filters} onChange={update} />
      <PlayerResults filters={filters} onPageChange={(page) => update({ page })} />
    </>
  );
}
