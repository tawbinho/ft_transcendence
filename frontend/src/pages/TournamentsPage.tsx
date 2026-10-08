import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { CrownIcon, GlobeIcon, PlusIcon, UsersIcon } from '@/components/icons';
import { LoadError } from '@/components/LoadError';
import { PageHeader } from '@/components/PageHeader';
import { Badge, buttonClass, EmptyState, OptionGroup, PageSpinner, Pagination } from '@/components/ui';
import { useCurrentUser } from '@/features/auth/hooks';
import { TournamentStatusBadge } from '@/features/tournaments/components/TournamentStatusBadge';
import { useTournaments } from '@/features/tournaments/hooks';
import { loadLocalTournament } from '@/features/tournaments/local';
import { TOURNAMENT_STATUSES, type TournamentStatus, type TournamentSummary } from '@/features/tournaments/types';
import { cn } from '@/lib/cn';
import { pageCount, readPage } from '@/lib/pages';
import { useUrlParams } from '@/lib/useUrlParams';

const PAGE_SIZE = 10;
const FILTERS = ['all', ...TOURNAMENT_STATUSES] as const;
type Filter = (typeof FILTERS)[number];

const isFilter = (value: string | null): value is Filter => FILTERS.includes(value as Filter);

export function TournamentsPage() {
  const { t } = useTranslation();
  const { data: user } = useCurrentUser();
  const localInProgress = loadLocalTournament() !== null;

  return (
    <>
      <PageHeader title={t('tournaments.title')} subtitle={t('tournaments.subtitle')} />
      <div className="mb-10 grid gap-4 md:grid-cols-2">
        <ModeCard icon={<UsersIcon />} title={t('localTournament.title')} body={t('localTournament.cardBody')}>
          <Link to="/tournaments/local" className={buttonClass({ variant: 'secondary', block: true })}>
            {localInProgress ? t('localTournament.resume') : t('localTournament.setUp')}
          </Link>
        </ModeCard>
        <ModeCard icon={<GlobeIcon />} title={t('tournaments.onlineTitle')} body={t('tournaments.onlineBody')}>
          {user ? (
            <Link to="/tournaments/new" className={buttonClass({ block: true })}>
              <PlusIcon />
              {t('tournaments.create')}
            </Link>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted">{t('tournaments.loginRequired')}</p>
              <Link to="/login" state={{ from: { pathname: '/tournaments' } }} className={buttonClass({ block: true })}>
                {t('nav.login')}
              </Link>
            </div>
          )}
        </ModeCard>
      </div>
      {user && <OnlineTournaments />}
    </>
  );
}

function ModeCard({
  icon,
  title,
  body,
  children,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <span className="grid size-12 place-items-center rounded-xl bg-primary/12 text-2xl text-primary">{icon}</span>
      <div className="flex-1">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="mt-1 text-muted">{body}</p>
      </div>
      {children}
    </section>
  );
}

/** Online tournaments, filtered by status, with pages; both in the URL. */
function OnlineTournaments() {
  const { t } = useTranslation();
  const [params, setParams] = useUrlParams();
  const statusParam = params.get('status');
  const filter: Filter = isFilter(statusParam) ? statusParam : 'all';
  const page = readPage(params);
  const list = useTournaments({
    status: filter === 'all' ? undefined : (filter as TournamentStatus),
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  function go(next: { filter?: Filter; page?: number }) {
    const search = new URLSearchParams();
    const nextFilter = next.filter ?? filter;
    if (nextFilter !== 'all') search.set('status', nextFilter);
    if ((next.page ?? 1) > 1) search.set('page', String(next.page));
    setParams(search);
  }

  return (
    <section aria-labelledby="online-tournaments" className="flex flex-col gap-4">
      <h2 id="online-tournaments" className="text-xl font-bold">
        {t('tournaments.listTitle')}
      </h2>
      <OptionGroup
        legend={t('history.filterLabel')}
        value={filter}
        onChange={(value) => go({ filter: value })}
        options={FILTERS.map((value) => ({ value, label: t(`tournaments.filters.${value}`) }))}
      />
      {list.isPending ? (
        <PageSpinner />
      ) : list.error ? (
        <LoadError error={list.error} onRetry={() => void list.refetch()} retrying={list.isFetching} />
      ) : list.data.items.length === 0 ? (
        <EmptyState
          action={
            <Link to="/tournaments/new" className={buttonClass({ variant: 'secondary' })}>
              {t('tournaments.create')}
            </Link>
          }
        >
          {t('tournaments.empty')}
        </EmptyState>
      ) : (
        <ul
          className={cn(
            'divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface',
            list.isPlaceholderData && 'opacity-60',
          )}
        >
          {list.data.items.map((tournament) => (
            <li key={tournament.id}>
              <TournamentRow tournament={tournament} />
            </li>
          ))}
        </ul>
      )}
      {list.data && (
        <Pagination
          page={page}
          pages={pageCount(list.data.total, PAGE_SIZE)}
          label={t('tournaments.listTitle')}
          onChange={(next) => go({ page: next })}
        />
      )}
    </section>
  );
}

function TournamentRow({ tournament }: { tournament: TournamentSummary }) {
  const { t } = useTranslation();
  return (
    <Link
      to={paths.tournament(tournament.id)}
      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 transition hover:bg-surface-2"
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate font-semibold">{tournament.name}</span>
        {tournament.joined && <Badge tone="info">{t('tournaments.joined')}</Badge>}
      </span>
      <span className="justify-self-end">
        <TournamentStatusBadge status={tournament.status} />
      </span>
      <span className="text-sm text-muted">
        {t('tournaments.playerCount', { count: tournament.playerCount, size: tournament.size })} ·{' '}
        {t('game.size', { cols: tournament.settings.cols, rows: tournament.settings.rows })} ·{' '}
        {t('game.connect', { n: tournament.settings.winLength })}
      </span>
      <span className="flex items-center justify-end gap-1 text-sm text-muted">
        {tournament.winner && (
          <>
            <CrownIcon className="text-warning" />
            <span className="sr-only">{t('tournaments.winner')}:</span>
            <span className="font-semibold text-fg">{tournament.winner.displayName}</span>
          </>
        )}
      </span>
    </Link>
  );
}
