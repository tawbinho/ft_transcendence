import { useState } from 'react';
import { cn } from '@/lib/cn';

// Players without a picture get their first letter on a color picked from
// their name, so the same player always looks the same. Every color is dark
// enough for white text (contrast above 4.5:1) in light and dark mode.
const COLORS = ['#2d55d6', '#157a4c', '#b4235a', '#7a3486', '#0f6f69', '#9a4d00', '#4a5578', '#c22b3c'];

const SIZES = {
  xs: 'size-6 text-[0.65rem]',
  sm: 'size-8 text-sm',
  md: 'size-10 text-base',
  lg: 'size-16 text-2xl',
  xl: 'size-24 text-4xl',
} as const;

export type AvatarSize = keyof typeof SIZES;

function avatarColor(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + (char.codePointAt(0) ?? 0)) | 0;
  return COLORS[Math.abs(hash) % COLORS.length]!;
}

interface AvatarProps {
  user: { displayName: string; avatarUrl: string | null; online?: boolean };
  size?: AvatarSize;
  /** Adds a green dot while the player is online. */
  presence?: boolean;
  className?: string;
}

/**
 * A player's picture. Decorative: the name is always written next to it, and
 * the online state is also given as text where it matters.
 */
export function Avatar({ user, size = 'md', presence = false, className }: AvatarProps) {
  // A picture that fails to load falls back to the letter.
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null);
  const url = user.avatarUrl && user.avatarUrl !== brokenUrl ? user.avatarUrl : null;

  return (
    <span aria-hidden="true" className={cn('relative inline-flex flex-none', SIZES[size], className)}>
      {url ? (
        <img
          src={url}
          alt=""
          className="size-full rounded-full bg-surface-2 object-cover"
          onError={() => setBrokenUrl(url)}
        />
      ) : (
        <span
          className="grid size-full place-items-center rounded-full font-bold uppercase text-white"
          style={{ backgroundColor: avatarColor(user.displayName) }}
        >
          {Array.from(user.displayName)[0] ?? '?'}
        </span>
      )}
      {presence && user.online && (
        <span className="absolute end-0 bottom-0 size-[30%] min-h-2 min-w-2 rounded-full bg-success ring-2 ring-surface" />
      )}
    </span>
  );
}
