import { useEffect, useEffectEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SearchIcon } from '@/components/icons';
import { CheckboxField, SelectField } from '@/components/ui';
import { PLAYER_SORTS, type PlayerSort } from '@/features/users/types';
import type { PlayerFilters as Filters } from './playerFilters';

const SEARCH_MAX = 20;
const SEARCH_DELAY_MS = 300;

/** The search box, sort menu and checkboxes. It reports every change; the page keeps them in the URL. */
export function PlayerFilters({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (changes: Partial<Filters>) => void;
}) {
  const { t } = useTranslation();

  // The text box updates the URL once typing pauses, not on every key.
  const [text, setText] = useState(filters.search);
  const searchFor = useEffectEvent((search: string) => {
    if (search !== filters.search) onChange({ search });
  });
  useEffect(() => {
    const timer = setTimeout(() => searchFor(text.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [text]);

  return (
    <form
      role="search"
      aria-label={t('players.title')}
      onSubmit={(event) => {
        event.preventDefault();
        onChange({ search: text.trim() });
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
        value={filters.sort}
        options={PLAYER_SORTS.map((sort) => ({ value: sort, label: t(`players.sort.${sort}`) }))}
        onChange={(sort) => onChange({ sort: sort as PlayerSort })}
      />
      <div className="flex flex-wrap gap-x-6 gap-y-2 sm:col-span-2">
        <CheckboxField
          label={t('players.onlineOnly')}
          checked={filters.online}
          onChange={(event) => onChange({ online: event.target.checked })}
        />
        <CheckboxField
          label={t('players.friendsOnly')}
          checked={filters.friends}
          onChange={(event) => onChange({ friends: event.target.checked })}
        />
      </div>
    </form>
  );
}
