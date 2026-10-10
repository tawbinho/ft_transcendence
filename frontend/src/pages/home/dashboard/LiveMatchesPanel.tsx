import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { LoadError } from '@/components/LoadError';
import { EyeIcon } from '@/components/icons';
import { useLiveMatches } from '@/features/spectate/hooks';
import { Panel, PanelSkeleton } from './Panel';

/** How many matches are shown in the card; the Watch page has all of them. */
const SHOWN = 3;

/**
 * The same list as the Watch page (same request, same cache entry): how many
 * matches are being played right now, and the first few to open.
 */
export function LiveMatchesPanel() {
  const { t } = useTranslation();
  const { data, isPending, error, refetch, isRefetching } = useLiveMatches(1);

  return (
    <Panel title={t('home.live.title')} action={{ to: '/watch', label: t('home.live.watch') }}>
      {isPending ? (
        <PanelSkeleton />
      ) : error ? (
        <LoadError error={error} onRetry={() => void refetch()} retrying={isRefetching} />
      ) : data.total === 0 ? (
        <p className="text-muted">{t('home.live.none')}</p>
      ) : (
        <>
          <p className="text-muted">{t('home.live.count', { count: data.total })}</p>
          <ul className="flex flex-col gap-2">
            {data.items.slice(0, SHOWN).map((match) => {
              const names = match.players.map((player) => player.displayName).join(` ${t('online.vs')} `);
              return (
                <li key={match.id}>
                  {/* A match the member plays opens as a game, any other one as a spectator. */}
                  <Link
                    to={match.yourSeat !== null ? paths.match(match.id) : paths.watch(match.id)}
                    className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 transition hover:bg-surface-2"
                  >
                    <span className="min-w-0 flex-1 truncate font-semibold">{names}</span>
                    <EyeIcon className="flex-none text-muted" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Panel>
  );
}
