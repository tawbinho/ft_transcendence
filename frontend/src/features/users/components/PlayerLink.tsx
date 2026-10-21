import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { Avatar, type AvatarSize } from '@/components/ui';
import { cn } from '@/lib/cn';
import { isComputerPlayer } from '../computerPlayers';

interface PlayerLike {
  displayName: string;
  avatarUrl: string | null;
  online?: boolean;
  isBot?: boolean;
}

/** A player's avatar and name, linking to their profile, with an optional line under the name. A computer opponent has no profile, so it is only shown. */
export function PlayerLink({
  user,
  size = 'sm',
  presence = false,
  note,
  className,
}: {
  user: PlayerLike;
  size?: AvatarSize;
  presence?: boolean;
  note?: ReactNode;
  className?: string;
}) {
  const content = (
    <>
      <Avatar user={user} size={size} presence={presence} />
      <span className="min-w-0">
        <span className="block truncate font-semibold group-hover:text-primary group-hover:underline">
          {user.displayName}
        </span>
        {note && <span className="block truncate text-sm text-muted">{note}</span>}
      </span>
    </>
  );
  const classes = cn('group flex min-w-0 items-center gap-3 rounded-lg', className);

  if (isComputerPlayer(user)) return <div className={classes}>{content}</div>;

  return (
    <Link to={paths.profile(user.displayName)} className={classes}>
      {content}
    </Link>
  );
}
