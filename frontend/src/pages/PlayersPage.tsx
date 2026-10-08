import { useEffect, useEffectEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SearchIcon } from '@/components/icons';
import { LoadError } from '@/components/LoadError';
import { PageHeader } from '@/components/PageHeader';
import { Badge, CheckboxField, EmptyState, PageSpinner, Pagination, SelectField } from '@/components/ui';
import { FriendActions } from '@/features/users/components/FriendActions';
import { PlayerLink } from '@/features/users/components/PlayerLink';
import { usePlayerSearch } from '@/features/users/hooks';
import { PLAYER_SORTS, type PlayerSort } from '@/features/users/types';
import { cn } from '@/lib/cn';
import { pageCount, readPage } from '@/lib/pages';
import { useUrlParams } from '@/lib/useUrlParams';

const PAGE_SIZE = 12;
const SEARCH_MAX = 20;
const SEARCH_DELAY_MS = 300;

const isSort = (value: string | null): value is PlayerSort => PLAYER_SORTS.includes(value as PlayerSort);

/**
 * Player search with filters, sorting and pages. Everything lives in the URL
 * (?q=li&online=1&sort=wins&page=2), so a search can be reloaded or shared.
 */
export function PlayersPage() {
  const { t } = useTranslation();
  const [params, setParams] = useUrlParams();

  const search = params.get('q') ?? '';
  const online = params.get('online') === '1';
  const friends = params.get('friends') === '1';
  const sortParam = params.get('sort');
  const sort: PlayerSort = isSort(sortParam) ? sortParam : 'name';
  const page = readPage(params);

  /** Changes some filters; any change of filter goes back to page 1. */
  function update(changes: { q?: string; online?: boolean; friends?: boolean; sort?: PlayerSort; page?: number }) {
    const next = { q: search, online, friends, sort, page: 1, ...changes };
    const query = new URLSearchParams();
    if (next.q) query.set('q', next.q);
    if (next.online) query.set('online', '1');
    if (next.friends) query.set('friends', '1');
    if (next.sort !== 'name') query.set('sort', next.sort);
    if (next.page > 1) query.set('page', String(next.page));
    setParams(query);
  }

  // The text box updates the URL once typing pauses, not on every key.
  const [text, setText] = useState(search);
  const searchFor = useEffectEvent((q: string) => {
    if (q !== search) update({ q });
  });
  useEffect(() => {
    const timer = setTimeout(() => searchFor(text.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [text]);

  const results = usePlayerSearch({
    search: search || undefined,
    online: online || undefined,
    friends: friends || undefined,
    sort,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  return (
    <>
      <PageHeader title={t('players.title')} subtitle={t('players.subtitle')} />

      <form
        role="search"
        aria-label={t('players.title')}
        onSubmit={(event) => {
          event.preventDefault();
          update({ q: text.trim() });
        }}
        className="mb-6 grid gap-4 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-[minmax(0,1fr)_14rem] sm:p-5"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="player-search" className="text-sm font-semibold">
            {t('players.searchLabel')}
          </label>
          <div className="relative flex items-center">
            <SearchIcon className="pointer-events-none absolute start-3 text-muted" />
            <input
              id="player-search"
              type="search"
              value={text}
              maxLength={SEARCH_MAX}
              autoComplete="off"
              spellCheck={false}
              placeholder={t('players.searchPlaceholder')}
              onChange={(event) => setText(event.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-surface ps-10 pe-3 text-fg placeholder:text-muted/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            />
          </div>
        </div>
        <SelectField
          label={t('players.sortLabel')}
          value={sort}
          onChange={(event) => update({ sort: event.target.value as PlayerSort })}
        >
          {PLAYER_SORTS.map((value) => (
            <option key={value} value={value}>
              {t(`players.sort.${value}`)}
            </option>
          ))}
        </SelectField>
        <div className="flex flex-wrap gap-x-6 gap-y-2 sm:col-span-2">
          <CheckboxField
            label={t('players.onlineOnly')}
            checked={online}
            onChange={(event) => update({ online: event.target.checked })}
          />
          <CheckboxField
            label={t('players.friendsOnly')}
            checked={friends}
            onChange={(event) => update({ friends: event.target.checked })}
          />
        </div>
      </form>

      {results.isPending ? (
        <PageSpinner />
      ) : results.error ? (
        <LoadError error={results.error} onRetry={() => void results.refetch()} retrying={results.isFetching} />
      ) : (
        <section aria-label={t('players.results')} className="flex flex-col gap-4">
          <p role="status" className="text-sm text-muted">
            {t('players.resultCount', { count: results.data.total })}
          </p>
          {results.data.items.length === 0 ? (
            <EmptyState>{t('players.empty')}</EmptyState>
          ) : (
            <ul className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-3', results.isPlaceholderData && 'opacity-60')}>
              {results.data.items.map((player) => (
                <li key={player.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
                  <div className="flex items-start justify-between gap-2">
                    <PlayerLink
                      user={player}
                      size="md"
                      presence
                      note={t('players.record', {
                        wins: player.stats.wins,
                        losses: player.stats.losses,
                        draws: player.stats.draws,
                      })}
                    />
                    {player.friendship === 'self' && <Badge tone="info">{t('profile.you')}</Badge>}
                    {player.friendship === 'friends' && <Badge tone="success">{t('friends.friend')}</Badge>}
                  </div>
                  {player.friendship !== 'self' && player.friendship !== 'friends' && (
                    <FriendActions player={player} friendship={player.friendship} size="sm" />
                  )}
                </li>
              ))}
            </ul>
          )}
          <Pagination
            page={page}
            pages={pageCount(results.data.total, PAGE_SIZE)}
            label={t('players.title')}
            onChange={(next) => update({ page: next })}
          />
        </section>
      )}
    </>
  );
}
