import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TournamentDTO, TournamentMatchDTO } from '@cf/shared';
import { api, ApiClientError } from '../lib/api';
import { useAuth } from '../features/auth/AuthContext';
import { Button, Card, Spinner } from '../components/ui';

function BracketSlot({ player, winner }: { player: string | null; winner: string | null }) {
  const isWinner = player !== null && player === winner;
  return (
    <div className={`rounded-xl px-3 py-1.5 ${isWinner ? 'bg-success text-white' : 'bg-well'}`}>
      {player ?? <span className="text-muted">TBD</span>}
    </div>
  );
}

export function TournamentDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<TournamentDTO | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!id) return;
    api
      .get<TournamentDTO>(`/api/tournaments/${id}`)
      .then(setTournament)
      .catch((err) => setError(err instanceof ApiClientError ? err.message : ''));
  }, [id]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 4000);
    return () => clearInterval(timer);
  }, [load]);

  if (error) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <p className="text-danger">{error}</p>
        <Link to="/tournaments" className="mt-4 inline-block underline underline-offset-2">
          {t('common.back')}
        </Link>
      </Card>
    );
  }
  if (!tournament) return <Spinner />;

  const registered = user ? tournament.participants.includes(user.displayName) : false;
  const rounds = [...new Set(tournament.bracket.map((m) => m.round))].sort((a, b) => a - b);

  const canPlay = (m: TournamentMatchDTO) =>
    Boolean(user) &&
    !m.winner &&
    !m.matchId &&
    !!m.playerA &&
    !!m.playerB &&
    (m.playerA === user!.displayName || m.playerB === user!.displayName);

  async function register() {
    try {
      await api.post(`/api/tournaments/${id}/register`);
      load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : t('errors.generic'));
    }
  }

  async function start() {
    try {
      await api.post(`/api/tournaments/${id}/start`);
      load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : t('errors.generic'));
    }
  }

  async function play(bracketMatchId: string) {
    try {
      const { matchId } = await api.post<{ matchId: string }>(
        `/api/tournaments/${id}/matches/${bracketMatchId}/start`,
      );
      navigate(`/match/${matchId}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : t('errors.generic'));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl font-extrabold">{tournament.name}</h1>
        <span className="rounded-full bg-raised px-4 py-1 font-bold shadow-clay-sm">
          {t(`tournaments.${tournament.status}`)}
        </span>
      </div>

      {tournament.champion && (
        <Card>
          <p className="font-display text-xl font-bold">
            🏆 {t('tournaments.champion', { name: tournament.champion })}
          </p>
        </Card>
      )}

      <div className="flex flex-wrap gap-3">
        {tournament.status === 'registering' && user && !registered && (
          <Button onClick={() => void register()}>{t('tournaments.register')}</Button>
        )}
        {tournament.status === 'registering' && (
          <Button variant="secondary" onClick={() => void start()}>
            {t('tournaments.start')}
          </Button>
        )}
      </div>

      <section>
        <h2 className="mb-3 font-display text-2xl font-bold">
          {t('tournaments.participants')} ({tournament.participants.length})
        </h2>
        <Card>
          <div className="flex flex-wrap gap-2">
            {tournament.participants.map((p) => (
              <span key={p} className="rounded-full bg-well px-3 py-1 shadow-clay-in">
                {p}
              </span>
            ))}
          </div>
        </Card>
      </section>

      {tournament.bracket.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-2xl font-bold">{t('tournaments.bracket')}</h2>
          <div className="flex gap-6 overflow-x-auto pb-2">
            {rounds.map((round) => (
              <div key={round} className="min-w-[220px] space-y-3">
                <p className="text-sm text-muted">{t('tournaments.round', { n: round })}</p>
                {tournament.bracket
                  .filter((m) => m.round === round)
                  .sort((a, b) => a.slot - b.slot)
                  .map((m) => (
                    <Card key={m.id} className="space-y-1 p-3">
                      <BracketSlot player={m.playerA} winner={m.winner} />
                      <p className="text-center text-xs text-muted">{t('tournaments.vs')}</p>
                      <BracketSlot player={m.playerB} winner={m.winner} />
                      {canPlay(m) && (
                        <Button className="mt-2 w-full" onClick={() => void play(m.id)}>
                          {t('tournaments.playMatch')}
                        </Button>
                      )}
                      {m.matchId && !m.winner && (
                        <Link
                          to={`/match/${m.matchId}`}
                          className="mt-2 block text-center text-sm underline underline-offset-2"
                        >
                          {t('spectate.watch')}
                        </Link>
                      )}
                    </Card>
                  ))}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
