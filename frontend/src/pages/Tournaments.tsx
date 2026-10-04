import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TournamentDTO } from '@cf/shared';
import { api, ApiClientError } from '../lib/api';
import { useAuth } from '../features/auth/AuthContext';
import { Button, Card, Field } from '../components/ui';

export function Tournaments() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [list, setList] = useState<TournamentDTO[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<TournamentDTO[]>('/api/tournaments').then(setList).catch(() => undefined);
  }, []);

  async function create() {
    if (!user) return navigate('/login');
    setError('');
    try {
      const tournament = await api.post<TournamentDTO>('/api/tournaments', { name });
      navigate(`/tournaments/${tournament.id}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : t('errors.generic'));
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="font-display text-4xl font-extrabold">{t('tournaments.title')}</h1>

      <Card className="max-w-lg">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Field label={t('tournaments.name')} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <Button onClick={() => void create()}>{t('tournaments.create')}</Button>
        </div>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </Card>

      {list.length === 0 ? (
        <Card>
          <p className="text-muted">{t('tournaments.empty')}</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((tournament) => (
            <Link key={tournament.id} to={`/tournaments/${tournament.id}`}>
              <Card>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-lg font-bold">{tournament.name}</p>
                    <p className="text-sm text-muted">
                      {t(`tournaments.${tournament.status}`)} · {tournament.participants.length}{' '}
                      {t('tournaments.participants')}
                    </p>
                  </div>
                  {tournament.champion && <span className="text-xl">🏆</span>}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
