import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { Avatar, type AvatarSize } from '@/components/ui';
import { cn } from '@/lib/cn';

interface PlayerLike {
  displayName: string;
  avatarUrl: string | null;
  online?: boolean;
}

/**
 * A player's avatar and name, linking to their profile, with an optional line under the name.
 * With `linked={false}` it is only a picture and a name, for players that have no profile page to open.
 */
export function PlayerLink({
  user,
  size = 'sm',
  presence = false,
  linked = true,
  note,
  className,
}: {
  user: PlayerLike;
  size?: AvatarSize;
  presence?: boolean;
  linked?: boolean;
  note?: ReactNode;
  className?: string;
}) {
  const content = (
    <>
      <Avatar user={user} size={size} presence={presence} />
      <span className="min-w-0">
        <span
          className={cn('block truncate font-semibold', linked && 'group-hover:text-primary group-hover:underline')}
        >
          {user.displayName}
        </span>
        {note && <span className="block truncate text-sm text-muted">{note}</span>}
      </span>
    </>
  );
  const classes = cn('group flex min-w-0 items-center gap-3 rounded-lg', className);

  if (!linked) return <div className={classes}>{content}</div>;
  return (
    <Link to={paths.profile(user.displayName)} className={classes}>
      {content}
    </Link>
  );
}
