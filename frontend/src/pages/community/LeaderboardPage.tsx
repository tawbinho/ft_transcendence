import { useTranslation } from 'react-i18next';
import { LoadError } from '@/components/LoadError';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState, PageSpinner, Pagination } from '@/components/ui';
import { withoutComputerPlayers } from '@/features/users/computerPlayers';
import { usePlayerSearch } from '@/features/users/hooks';
import type { PlayerListItem } from '@/features/users/types';
import { cn } from '@/lib/cn';
import { pageCount, readPage } from '@/lib/pages';
import { useUrlParams } from '@/lib/useUrlParams';
import { CommunityTabs } from './CommunityTabs';
import { LeaderboardTable } from './leaderboard/LeaderboardTable';
import { Podium } from './leaderboard/Podium';
import { splitPodium } from './leaderboard/ranking';

const PAGE_SIZE = 10;

/** The most players one request can return. The board is cut into pages here, so it shows this many players at most. */
const BOARD_SIZE = 50;

/**
 * The players with the most wins: a podium for the best three on the first page, then a table.
 * The computer opponents are left out. Because the server pages by its own count, one request
 * asks for the whole board and the pages are cut here, so ranks never skip a number.
 */
export function LeaderboardPage() {
  const { t } = useTranslation();
  const [params, setParams] = useUrlParams();
  const results = usePlayerSearch({ sort: 'wins', limit: BOARD_SIZE });
  const ranked = withoutComputerPlayers(results.data?.items ?? []);
  const pages = pageCount(ranked.length, PAGE_SIZE);
  const page = Math.min(readPage(params), pages);
  const offset = (page - 1) * PAGE_SIZE;

  return (
    <>
      <PageHeader title={t('leaderboard.title')} subtitle={t('leaderboard.subtitle')} className="mb-4" />
      <CommunityTabs />

      {results.isPending ? (
        <PageSpinner />
      ) : results.error ? (
        <LoadError error={results.error} onRetry={() => void results.refetch()} retrying={results.isFetching} />
      ) : ranked.length === 0 ? (
        <EmptyState illustration="trophy">{t('leaderboard.empty')}</EmptyState>
      ) : (
        <LeaderboardPlaces
          players={ranked.slice(offset, offset + PAGE_SIZE)}
          page={page}
          offset={offset}
          pages={pages}
          faded={results.isPlaceholderData}
          onPageChange={(next) => setParams(next > 1 ? { page: String(next) } : {})}
        />
      )}
    </>
  );
}

function LeaderboardPlaces({
  players,
  page,
  offset,
  pages,
  faded,
  onPageChange,
}: {
  players: PlayerListItem[];
  page: number;
  offset: number;
  pages: number;
  faded: boolean;
  onPageChange: (page: number) => void;
}) {
  const { t } = useTranslation();
  const { podium, rest } = splitPodium(players, page);

  // Not wider than a table needs: across the whole page a player and their numbers are too far apart to read as a row.
  return (
    <div className={cn('flex max-w-3xl flex-col gap-4', faded && 'opacity-60')}>
      {podium.length > 0 && <Podium players={podium} />}
      {rest.length > 0 && <LeaderboardTable players={rest} offset={offset + podium.length} />}
      <Pagination page={page} pages={pages} label={t('leaderboard.title')} onChange={onPageChange} />
    </div>
  );
}
