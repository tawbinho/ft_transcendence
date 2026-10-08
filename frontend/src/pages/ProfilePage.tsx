import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { paths } from '@/app/paths';
import { ChatIcon, PlayIcon, SlidersIcon } from '@/components/icons';
import { LoadError } from '@/components/LoadError';
import { PageHeader } from '@/components/PageHeader';
import { StatTiles } from '@/components/StatTiles';
import {
  Alert,
  Avatar,
  Badge,
  buttonClass,
  Card,
  EmptyState,
  PageSpinner,
  Pagination,
  type BadgeTone,
} from '@/components/ui';
import { BlockButton } from '@/features/chat/components/BlockButton';
import { FriendActions } from '@/features/users/components/FriendActions';
import { PresenceText } from '@/features/users/components/PresenceText';
import { PROFILE_MATCHES_PAGE, useProfile, useProfileMatches } from '@/features/users/hooks';
import type { Profile, ProfileMatch } from '@/features/users/types';
import { isApiError } from '@/lib/api/errors';
import { cn } from '@/lib/cn';
import { formatDate, formatDateTime, formatPercent } from '@/lib/format';
import { pageCount, readPage } from '@/lib/pages';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
import { useUrlParams } from '@/lib/useUrlParams';

export function ProfilePage() {
  const { displayName = '' } = useParams();
  return <ProfileScreen key={displayName} displayName={displayName} />;
}

function ProfileScreen({ displayName }: { displayName: string }) {
  const { t } = useTranslation();
  const profile = useProfile(displayName);

  if (profile.isPending) return <PageSpinner />;
  if (!profile.data) {
    if (isApiError(profile.error, 'USER_NOT_FOUND')) {
      return (
        <div className="mx-auto max-w-lg">
          <PageHeader title={t('profile.notFoundTitle')} />
          <Card className="flex flex-col items-start gap-4">
            <p className="text-muted">{t('profile.notFoundBody', { name: displayName })}</p>
            <Link to="/players" className={buttonClass()}>
              {t('players.findPlayers')}
            </Link>
          </Card>
        </div>
      );
    }
    return <LoadError error={profile.error} onRetry={() => void profile.refetch()} retrying={profile.isFetching} />;
  }

  return <ProfileView player={profile.data} />;
}

function ProfileView({ player }: { player: Profile }) {
  const { t, i18n } = useTranslation();
  useDocumentTitle(player.displayName);
  const self = player.friendship === 'self';
  const { stats } = player;

  return (
    <div className="flex flex-col gap-8">
      <Card className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <Avatar user={player} size="xl" presence />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-3xl font-extrabold tracking-tight">{player.displayName}</h1>
            {self && <Badge tone="info">{t('profile.you')}</Badge>}
            {player.friendship === 'friends' && <Badge tone="success">{t('friends.friend')}</Badge>}
          </div>
          <p className="mt-1 text-muted">
            <PresenceText online={player.online} lastSeenAt={player.lastSeenAt} />
            <span aria-hidden="true"> · </span>
            {t('profile.memberSince', { date: formatDate(player.createdAt, i18n.language) })}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          {self ? (
            <Link to="/account" className={buttonClass({ variant: 'secondary' })}>
              <SlidersIcon />
              {t('profile.edit')}
            </Link>
          ) : (
            <>
              {!player.blocked && (
                <div className="flex flex-wrap gap-2">
                  <Link to={paths.chat(player.displayName)} className={buttonClass({ variant: 'secondary' })}>
                    <ChatIcon />
                    {t('profile.message')}
                  </Link>
                  <Link to={paths.challenge(player.displayName)} className={buttonClass({ variant: 'secondary' })}>
                    <PlayIcon />
                    {t('profile.challenge')}
                  </Link>
                </div>
              )}
              {!player.blocked && <FriendActions player={player} friendship={player.friendship} />}
            </>
          )}
        </div>
      </Card>

      {player.blocked && (
        <Alert
          tone="warning"
          title={t('block.blockedTitle')}
          action={<BlockButton player={player} blocked size="sm" variant="secondary" />}
        >
          {t('block.blockedBody')}
        </Alert>
      )}

      <section aria-labelledby="profile-stats" className="flex flex-col gap-4">
        <h2 id="profile-stats" className="text-xl font-bold">
          {t('history.statsTitle')}
        </h2>
        <StatTiles
          className="lg:grid-cols-5"
          tiles={[
            [t('history.played'), String(stats.played)],
            [t('history.wins'), String(stats.wins)],
            [t('history.losses'), String(stats.losses)],
            [t('history.draws'), String(stats.draws)],
            [
              t('history.winRate'),
              stats.played > 0 ? formatPercent(stats.wins / stats.played, i18n.language) : t('history.none'),
            ],
          ]}
        />
      </section>

      <section aria-labelledby="profile-matches" className="flex flex-col gap-4">
        <h2 id="profile-matches" className="text-xl font-bold">
          {t('profile.matchesTitle')}
        </h2>
        <ProfileMatches player={player} />
      </section>

      {!self && !player.blocked && (
        <div className="border-t border-border pt-6">
          <BlockButton player={player} blocked={false} size="sm" />
        </div>
      )}
    </div>
  );
}

const RESULT_TONES: Record<ProfileMatch['result'], BadgeTone> = { win: 'success', loss: 'danger', draw: 'neutral' };
const RESULT_LABELS = { win: 'history.status.won', loss: 'history.status.lost', draw: 'history.status.draw' } as const;

/** The player's finished matches, newest first. The viewer's own rows open the match. */
function ProfileMatches({ player }: { player: Profile }) {
  const { t, i18n } = useTranslation();
  const [params, setParams] = useUrlParams();
  const page = readPage(params);
  const matches = useProfileMatches(player.displayName, page);
  const self = player.friendship === 'self';

  if (matches.isPending) return <PageSpinner />;
  if (matches.error) {
    return <LoadError error={matches.error} onRetry={() => void matches.refetch()} retrying={matches.isFetching} />;
  }
  if (matches.data.items.length === 0) return <EmptyState>{t('profile.noMatches')}</EmptyState>;

  const rowClass =
    'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_8rem_10rem_6.5rem]';

  return (
    <>
      <ul
        className={cn(
          'divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface',
          matches.isPlaceholderData && 'opacity-60',
        )}
      >
        {matches.data.items.map((match) => {
          const cells = (
            <>
              <span className="truncate">
                <span className="text-muted">{t('online.vs')} </span>
                <span className="font-semibold">{match.opponent.displayName}</span>
              </span>
              <span className="justify-self-end sm:order-last">
                <Badge tone={RESULT_TONES[match.result]}>{t(RESULT_LABELS[match.result])}</Badge>
              </span>
              <span className="text-sm text-muted">
                {t('game.size', { cols: match.settings.cols, rows: match.settings.rows })} ·{' '}
                {t('game.connect', { n: match.settings.winLength })}
              </span>
              <span className="text-end text-sm text-muted sm:text-start">
                <time dateTime={match.endedAt}>{formatDateTime(match.endedAt, i18n.language)}</time>
              </span>
            </>
          );
          return (
            <li key={match.id}>
              {self ? (
                <Link
                  to={paths.match(match.id)}
                  aria-label={t('history.open', { name: match.opponent.displayName })}
                  className={cn(rowClass, 'transition hover:bg-surface-2')}
                >
                  {cells}
                </Link>
              ) : (
                <div className={rowClass}>{cells}</div>
              )}
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
