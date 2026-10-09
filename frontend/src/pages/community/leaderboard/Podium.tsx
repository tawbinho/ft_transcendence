import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { CrownIcon, MedalIcon } from '@/components/icons';
import { Avatar, Badge } from '@/components/ui';
import type { PlayerListItem } from '@/features/users/types';
import { cn } from '@/lib/cn';
import { formatPercent } from '@/lib/format';
import { rankOf, winRate } from './ranking';

// On a wide screen the winner stands in the middle, taller. The order in the page
// stays 1, 2, 3 for screen readers; only `order` moves the cards.
const POSITION = ['sm:order-2 sm:-mt-4', 'sm:order-1', 'sm:order-3'];

/** The three best players as cards. */
export function Podium({ players }: { players: PlayerListItem[] }) {
  const { t } = useTranslation();

  return (
    <ol aria-label={t('leaderboard.podium')} className="mb-8 grid gap-4 sm:grid-cols-3 sm:items-end">
      {players.map((player, index) => (
        <PodiumCard key={player.id} player={player} rank={rankOf(0, index)} className={POSITION[index]} />
      ))}
    </ol>
  );
}

/** A row on a phone (picture, then details); a centered column from "sm" up. */
function PodiumCard({ player, rank, className }: { player: PlayerListItem; rank: number; className?: string }) {
  const { t, i18n } = useTranslation();
  const rate = winRate(player.stats);
  const first = rank === 1;

  return (
    <li
      className={cn(
        'flex min-w-0 items-center gap-4 rounded-2xl border bg-surface p-4 sm:flex-col sm:gap-2 sm:p-5 sm:text-center',
        first ? 'border-primary bg-primary/8 sm:pb-8 sm:pt-7' : 'border-border',
        className,
      )}
    >
      <div className="flex flex-col items-center gap-1 sm:gap-2">
        <p className="flex items-center gap-1.5 text-lg font-extrabold text-primary">
          {first ? <CrownIcon aria-hidden="true" /> : <MedalIcon aria-hidden="true" />}
          <span aria-hidden="true">{rank}</span>
          <span className="sr-only">{t('leaderboard.place', { rank })}</span>
        </p>
        <Avatar user={player} size="lg" presence className="sm:size-24 sm:text-4xl" />
      </div>
      <div className="flex min-w-0 flex-col gap-1 sm:items-center">
        <Link
          to={paths.profile(player.displayName)}
          className="truncate text-lg font-bold hover:text-primary hover:underline"
        >
          {player.displayName}
        </Link>
        {player.friendship === 'self' && (
          <span>
            <Badge tone="info">{t('profile.you')}</Badge>
          </span>
        )}
        <p className="text-sm font-semibold">{t('leaderboard.winsCount', { count: player.stats.wins })}</p>
        <p className="text-sm text-muted">
          {rate === null
            ? t('leaderboard.noGames')
            : `${t('leaderboard.winRate')}: ${formatPercent(rate, i18n.language)}`}
        </p>
      </div>
    </li>
  );
}
