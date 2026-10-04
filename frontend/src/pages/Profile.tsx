import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { MatchSummaryDTO, UserStatsDTO } from '@cf/shared';
import { api, ApiClientError } from '../lib/api';
import { useAuth } from '../features/auth/AuthContext';
import { Button, Card, Field, Spinner } from '../components/ui';

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Card>
      <p className="text-sm text-muted">{label}</p>
      <p className="font-display text-3xl font-extrabold">{value}</p>
    </Card>
  );
}

export function Profile() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [stats, setStats] = useState<UserStatsDTO | null>(null);
  const [history, setHistory] = useState<MatchSummaryDTO[]>([]);
  const [twoFactor, setTwoFactor] = useState<boolean | null>(null);
  const [qr, setQr] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) return;
    api
      .get<UserStatsDTO>(`/api/users/${encodeURIComponent(user.displayName)}/stats`)
      .then(setStats)
      .catch(() => undefined);
    api.get<MatchSummaryDTO[]>('/api/me/history').then(setHistory).catch(() => undefined);
    api
      .get<{ enabled: boolean }>('/api/auth/2fa/status')
      .then((r) => setTwoFactor(r.enabled))
      .catch(() => setTwoFactor(false));
  }, [user]);

  if (!user) return <Spinner />;

  const resultLabel = (r: MatchSummaryDTO['result']) =>
    r === 'win' ? t('profile.win') : r === 'loss' ? t('profile.loss') : t('profile.drawResult');

  async function beginSetup() {
    setMessage('');
    try {
      const { qr: dataUrl } = await api.post<{ qr: string }>('/api/auth/2fa/setup');
      setQr(dataUrl);
    } catch (err) {
      setMessage(err instanceof ApiClientError ? err.message : t('errors.generic'));
    }
  }

  async function enable() {
    setMessage('');
    try {
      await api.post('/api/auth/2fa/enable', { code });
      setTwoFactor(true);
      setQr('');
      setCode('');
    } catch (err) {
      setMessage(err instanceof ApiClientError ? err.message : t('errors.generic'));
    }
  }

  async function disable() {
    setMessage('');
    try {
      await api.post('/api/auth/2fa/disable');
      setTwoFactor(false);
    } catch (err) {
      setMessage(err instanceof ApiClientError ? err.message : t('errors.generic'));
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="font-display text-4xl font-extrabold">{user.displayName}</h1>

      <section className="grid gap-5 sm:grid-cols-4">
        <Stat label={t('profile.rating')} value={stats?.user.rating ?? user.rating} />
        <Stat label={t('profile.wins')} value={stats?.wins ?? 0} />
        <Stat label={t('profile.losses')} value={stats?.losses ?? 0} />
        <Stat label={t('profile.streak')} value={stats?.streak ?? 0} />
      </section>

      <section>
        <h2 className="mb-4 font-display text-2xl font-bold">{t('profile.history')}</h2>
        {history.length === 0 ? (
          <Card>
            <p className="text-muted">{t('profile.noHistory')}</p>
          </Card>
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-sm text-muted">
                  <th className="p-2 text-start">{t('profile.opponent')}</th>
                  <th className="p-2 text-start">{t('profile.result')}</th>
                  <th className="p-2 text-end">{t('profile.date')}</th>
                </tr>
              </thead>
              <tbody>
                {history.map((m) => (
                  <tr key={m.id} className="border-t border-well">
                    <td className="p-2 font-bold">{m.opponent}</td>
                    <td className="p-2">{resultLabel(m.result)}</td>
                    <td className="p-2 text-end text-muted">
                      {new Date(m.playedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-display text-2xl font-bold">{t('profile.twoFactor')}</h2>
        <Card className="max-w-md space-y-3">
          {twoFactor === null ? (
            <Spinner />
          ) : twoFactor ? (
            <Button variant="danger" onClick={() => void disable()}>
              {t('profile.disable2fa')}
            </Button>
          ) : qr ? (
            <>
              <p className="text-sm text-muted">{t('profile.scan')}</p>
              <img src={qr} alt="2FA QR code" className="mx-auto rounded-xl bg-white p-2" />
              <Field
                label={t('auth.code')}
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <Button onClick={() => void enable()}>{t('profile.enable2fa')}</Button>
            </>
          ) : (
            <Button onClick={() => void beginSetup()}>{t('profile.enable2fa')}</Button>
          )}
          {message && <p className="text-sm text-danger">{message}</p>}
        </Card>
      </section>
    </div>
  );
}
