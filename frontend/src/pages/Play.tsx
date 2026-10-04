import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DEFAULT_MATCH, THEMES } from '@cf/shared';
import type { Theme } from '@cf/shared';
import { api, ApiClientError } from '../lib/api';
import { useAuth } from '../features/auth/AuthContext';
import { Button, Card, Field, Select } from '../components/ui';

const COLS = [6, 7, 8, 9, 10];
const ROWS = [5, 6, 7, 8, 9];

export function Play() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [cols, setCols] = useState<number>(DEFAULT_MATCH.cols);
  const [rows, setRows] = useState<number>(DEFAULT_MATCH.rows);
  const [winLength, setWinLength] = useState<number>(DEFAULT_MATCH.winLength);
  const [theme, setTheme] = useState<Theme>('classic');
  const [difficulty, setDifficulty] = useState('normal');
  const [opponent, setOpponent] = useState('');
  const [error, setError] = useState('');

  const query = new URLSearchParams({
    cols: String(cols),
    rows: String(rows),
    winLength: String(Math.min(winLength, Math.min(cols, rows))),
    theme,
  }).toString();

  const settings = { cols, rows, winLength: Math.min(winLength, Math.min(cols, rows)), theme };

  async function createOnline() {
    if (!user) return navigate('/login');
    setError('');
    try {
      const { matchId } = await api.post<{ matchId: string }>('/api/matches', {
        settings,
        opponent: opponent || undefined,
      });
      navigate(`/match/${matchId}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : t('errors.generic'));
    }
  }

  async function quickMatch() {
    if (!user) return navigate('/login');
    setError('');
    try {
      const { matchId } = await api.post<{ matchId: string }>('/api/matches/quick', { settings });
      navigate(`/match/${matchId}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : t('errors.generic'));
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="font-display text-4xl font-extrabold">{t('play.title')}</h1>

      <Card>
        <h2 className="mb-4 font-display text-xl font-bold">{t('play.customize')}</h2>
        <div className="grid gap-4 sm:grid-cols-4">
          <Select label={t('play.cols')} value={cols} onChange={(e) => setCols(Number(e.target.value))}>
            {COLS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </Select>
          <Select label={t('play.rows')} value={rows} onChange={(e) => setRows(Number(e.target.value))}>
            {ROWS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </Select>
          <Select label={t('play.winLength')} value={winLength} onChange={(e) => setWinLength(Number(e.target.value))}>
            <option value={4}>4</option>
            <option value={5}>5</option>
          </Select>
          <Select label={t('play.theme')} value={theme} onChange={(e) => setTheme(e.target.value as Theme)}>
            {THEMES.map((th) => (
              <option key={th} value={th}>{th}</option>
            ))}
          </Select>
        </div>
      </Card>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <h3 className="font-display text-lg font-bold">{t('play.local')}</h3>
          <p className="mt-1 text-sm text-muted">{t('play.localDesc')}</p>
          <Button className="mt-4" variant="secondary" onClick={() => navigate(`/play/local?${query}`)}>
            {t('play.start')}
          </Button>
        </Card>

        <Card>
          <h3 className="font-display text-lg font-bold">{t('play.ai')}</h3>
          <p className="mt-1 text-sm text-muted">{t('play.aiDesc')}</p>
          <div className="mt-4 flex items-end gap-3">
            <Select label={t('play.difficulty')} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="easy">{t('play.easy')}</option>
              <option value="normal">{t('play.normal')}</option>
              <option value="hard">{t('play.hard')}</option>
            </Select>
            <Button variant="secondary" onClick={() => navigate(`/play/ai?${query}&difficulty=${difficulty}`)}>
              {t('play.start')}
            </Button>
          </div>
        </Card>

        <Card>
          <h3 className="font-display text-lg font-bold">{t('play.online')}</h3>
          <p className="mt-1 text-sm text-muted">{t('play.onlineDesc')}</p>
          <div className="mt-4 space-y-3">
            <Field
              label={t('play.opponentName')}
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
            />
            <Button onClick={() => void createOnline()}>{t('play.createChallenge')}</Button>
          </div>
        </Card>

        <Card>
          <h3 className="font-display text-lg font-bold">{t('play.quick')}</h3>
          <p className="mt-1 text-sm text-muted">{t('play.quickDesc')}</p>
          <Button className="mt-4" onClick={() => void quickMatch()}>
            {t('play.quick')}
          </Button>
        </Card>
      </div>
    </div>
  );
}
