import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui';
import { PlayerLink } from '@/features/users/components/PlayerLink';
import type { PlayerListItem } from '@/features/users/types';
import { cn } from '@/lib/cn';
import { formatPercent } from '@/lib/format';
import { rankOf, winRate } from './ranking';

/**
 * The ranking as a real table. Losses and draws only show from the "sm" width
 * up, so the table never makes a phone scroll sideways.
 */
export function LeaderboardTable({ players, offset }: { players: PlayerListItem[]; offset: number }) {
  const { t, i18n } = useTranslation();
  const head = 'px-3 py-2.5 text-start text-sm font-semibold text-muted';
  const cell = 'px-3 py-3 tabular-nums';

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <table className="w-full table-fixed border-collapse">
        <caption className="sr-only">{t('leaderboard.ranking')}</caption>
        <thead className="border-b border-border bg-surface-2">
          <tr>
            <th scope="col" className={cn(head, 'w-14')}>
              {t('leaderboard.rank')}
            </th>
            <th scope="col" className={head}>
              {t('leaderboard.player')}
            </th>
            <th scope="col" className={cn(head, 'w-16 sm:w-20')}>
              {t('leaderboard.wins')}
            </th>
            <th scope="col" className={cn(head, 'hidden w-20 sm:table-cell')}>
              {t('leaderboard.losses')}
            </th>
            <th scope="col" className={cn(head, 'hidden w-20 sm:table-cell')}>
              {t('leaderboard.draws')}
            </th>
            <th scope="col" className={cn(head, 'w-20 sm:w-28')}>
              {t('leaderboard.winRate')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {players.map((player, index) => {
            const rate = winRate(player.stats);
            return (
              <tr key={player.id} className={cn(player.friendship === 'self' && 'bg-primary/10')}>
                <th scope="row" className={cn(cell, 'text-start font-bold')}>
                  {rankOf(offset, index)}
                </th>
                <td className="px-3 py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <PlayerLink user={player} presence />
                    {player.friendship === 'self' && <Badge tone="info">{t('profile.you')}</Badge>}
                  </div>
                </td>
                <td className={cell}>{player.stats.wins}</td>
                <td className={cn(cell, 'hidden sm:table-cell')}>{player.stats.losses}</td>
                <td className={cn(cell, 'hidden sm:table-cell')}>{player.stats.draws}</td>
                <td className={cell}>
                  {rate === null ? (
                    <span aria-label={t('leaderboard.noGames')}>–</span>
                  ) : (
                    formatPercent(rate, i18n.language)
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
