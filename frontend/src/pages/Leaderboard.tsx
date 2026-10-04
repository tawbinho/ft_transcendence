import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LeaderboardEntryDTO } from '@cf/shared';
import { api } from '../lib/api';
import { Card, Spinner } from '../components/ui';

export function Leaderboard() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<LeaderboardEntryDTO[] | null>(null);

  useEffect(() => {
    api
      .get<LeaderboardEntryDTO[]>('/api/leaderboard')
      .then(setRows)
      .catch(() => setRows([]));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl font-extrabold">{t('leaderboard.title')}</h1>
      {rows === null ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <Card>
          <p className="text-muted">{t('leaderboard.empty')}</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-start">
            <thead>
              <tr className="text-start text-sm text-muted">
                <th className="p-2 text-start">{t('leaderboard.rank')}</th>
                <th className="p-2 text-start">{t('leaderboard.player')}</th>
                <th className="p-2 text-end">{t('leaderboard.rating')}</th>
                <th className="p-2 text-end">{t('leaderboard.record')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((entry) => (
                <tr key={entry.user.id} className="border-t border-well">
                  <td className="p-2 font-display font-extrabold text-accent-strong">{entry.rank}</td>
                  <td className="p-2 font-bold">{entry.user.displayName}</td>
                  <td className="p-2 text-end font-display">{entry.user.rating}</td>
                  <td className="p-2 text-end text-muted">
                    {entry.wins} / {entry.losses} / {entry.draws}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
