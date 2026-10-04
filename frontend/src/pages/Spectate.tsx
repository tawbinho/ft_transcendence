import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { LiveMatchDTO } from '@cf/shared';
import { api } from '../lib/api';
import { Button, Card } from '../components/ui';

export function Spectate() {
  const { t } = useTranslation();
  const [list, setList] = useState<LiveMatchDTO[]>([]);

  useEffect(() => {
    let active = true;
    const load = () =>
      api
        .get<LiveMatchDTO[]>('/api/matches/live')
        .then((rows) => active && setList(rows))
        .catch(() => undefined);
    void load();
    const timer = setInterval(load, 3000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl font-extrabold">{t('spectate.title')}</h1>
      {list.length === 0 ? (
        <Card>
          <p className="text-muted">{t('spectate.empty')}</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((match) => (
            <Card key={match.id}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold">{match.players.join(' vs ') || '—'}</p>
                  <p className="text-sm text-muted">
                    {match.cols}×{match.rows} · {t('spectate.viewers', { count: match.spectators })}
                  </p>
                </div>
                <Link to={`/match/${match.id}`}>
                  <Button>{t('spectate.watch')}</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
