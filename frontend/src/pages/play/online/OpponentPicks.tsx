import { useId, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { GlobeIcon } from '@/components/icons';
import { Avatar, Skeleton } from '@/components/ui';
import { useFriends } from '@/features/friends/hooks';
import { cn } from '@/lib/cn';

/** The player a match is kept for. The id is where the invitation is sent in the chat. */
export interface Opponent {
  id: string;
  displayName: string;
}

/**
 * Who may join the match: anyone with the link, or one player, picked from the friends (the server
 * lists the online ones first). A player filled in by a link (a profile's Challenge, a chat's
 * Invite) who is not a friend gets a choice too.
 */
export function OpponentPicks({
  selected,
  onPick,
}: {
  selected: Opponent | null;
  onPick: (opponent: Opponent | null) => void;
}) {
  const { t } = useTranslation();
  const labelId = useId();
  const friends = useFriends();
  // The player the form opened with stays a choice after picking someone else.
  const [fromLink] = useState(selected);

  const list = friends.data?.friends ?? [];
  const players =
    fromLink && !list.some((friend) => friend.id === fromLink.id)
      ? [{ ...fromLink, avatarUrl: null, online: false }, ...list]
      : list;

  return (
    <div role="group" aria-labelledby={labelId} className="flex flex-col gap-2">
      <p id={labelId} className="text-sm font-semibold">
        {t('online.opponent')}
      </p>
      <ul className="flex flex-wrap gap-2">
        <li>
          <Choice pressed={!selected} onClick={() => onPick(null)}>
            <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-primary">
              <GlobeIcon />
            </span>
            {t('online.anyone')}
          </Choice>
        </li>
        {players.map((player) => (
          <li key={player.id}>
            <Choice
              pressed={selected?.id === player.id}
              onClick={() => onPick({ id: player.id, displayName: player.displayName })}
            >
              <Avatar user={player} size="sm" presence />
              {player.displayName}
            </Choice>
          </li>
        ))}
        {friends.isPending && (
          <li>
            <Skeleton className="h-10 w-32 rounded-full" />
          </li>
        )}
      </ul>
      <p className="text-sm text-muted">
        {selected ? t('online.opponentHint', { name: selected.displayName }) : t('online.anyoneHint')}
        {friends.isError && ` ${t('online.friendsError')}`}
      </p>
    </div>
  );
}

function Choice({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        'flex h-10 items-center gap-2 rounded-full border ps-1.5 pe-4 font-semibold transition',
        pressed ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-surface hover:bg-surface-2',
      )}
    >
      {children}
    </button>
  );
}
