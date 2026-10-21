import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { LoadError } from '@/components/LoadError';
import { Badge, EmptyState, SectionSpinner, Pagination, type BadgeTone } from '@/components/ui';
import { PROFILE_MATCHES_PAGE, useProfileMatches } from '@/features/users/hooks';
import type { Profile, ProfileMatch } from '@/features/users/types';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';
import { pageCount, readPage } from '@/lib/pages';
import { useUrlParams } from '@/lib/useUrlParams';

const RESULT_TONES: Record<ProfileMatch['result'], BadgeTone> = { win: 'success', loss: 'danger', draw: 'neutral' };

const ROW_CLASS =
  'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_8rem_10rem_6.5rem]';

/** The player's finished matches, newest first, ten to a page. On your own profile each row opens the match. */
export function RecentMatches({ player }: { player: Profile }) {
  const { t, i18n } = useTranslation();
  const [params, setParams] = useUrlParams();
  const page = readPage(params);
  const matches = useProfileMatches(player.displayName, page);
  const self = player.friendship === 'self';

  if (matches.isPending) return <SectionSpinner />;
  if (matches.error) {
    return <LoadError error={matches.error} onRetry={() => void matches.refetch()} retrying={matches.isFetching} />;
  }
  if (matches.data.items.length === 0) return <EmptyState>{t('profile.noMatches')}</EmptyState>;

  return (
    <>
      <ul
        className={cn(
          'divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface',
          matches.isPlaceholderData && 'opacity-60',
        )}
      >
        {matches.data.items.map((match) => {
          const opponent = match.opponent.displayName;
          return (
            // On your own profile the opponent's name is a link that covers the whole row (the ::after layer).
            <li key={match.id} className={cn('relative', self && 'transition hover:bg-surface-2')}>
              <div className={ROW_CLASS}>
                <span className="truncate">
                  <span className="text-muted">{t('profile.versus')} </span>
                  {self ? (
                    <Link
                      to={paths.match(match.id)}
                      aria-label={t('profile.openMatch', { name: opponent })}
                      className="font-semibold after:absolute after:inset-0"
                    >
                      {opponent}
                    </Link>
                  ) : (
                    <span className="font-semibold">{opponent}</span>
                  )}
                </span>
                <span className="justify-self-end sm:order-last">
                  <Badge tone={RESULT_TONES[match.result]}>{t(`profile.result.${match.result}`)}</Badge>
                </span>
                <span className="text-sm text-muted">
                  <span dir="ltr">{t('game.size', { cols: match.settings.cols, rows: match.settings.rows })}</span> ·{' '}
                  {t('game.connect', { n: match.settings.winLength })}
                </span>
                <span className="text-end text-sm text-muted sm:text-start">
                  <time dateTime={match.endedAt}>{formatDateTime(match.endedAt, i18n.language)}</time>
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      <Pagination
        page={page}
        pages={pageCount(matches.data.total, PROFILE_MATCHES_PAGE)}
        label={t('profile.matchesTitle')}
        onChange={(next) => setParams(next > 1 ? { page: String(next) } : {})}
      />
    </>
  );
}
