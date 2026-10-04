import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { PublicUser } from '@cf/shared';
import { api, ApiClientError } from '../lib/api';
import { useAuth } from '../features/auth/AuthContext';
import { Button, Card, Field } from '../components/ui';

interface LoginResult {
  user: PublicUser | null;
  twoFactorRequired: boolean;
}

export function Login() {
  const { t } = useTranslation();
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [needsCode, setNeedsCode] = useState(false);
  const [error, setError] = useState('');

  async function onLogin(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      const result = await api.post<LoginResult>('/api/auth/login', { email, password });
      if (result.twoFactorRequired) setNeedsCode(true);
      else {
        setUser(result.user);
        navigate('/');
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : t('errors.generic'));
    }
  }

  async function onVerify(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      const result = await api.post<LoginResult>('/api/auth/2fa/verify', { code });
      setUser(result.user);
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : t('errors.generic'));
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <h1 className="mb-6 font-display text-3xl font-bold">
          {needsCode ? t('auth.twoFactorTitle') : t('auth.login')}
        </h1>

        {needsCode ? (
          <form onSubmit={onVerify} className="space-y-4">
            <p className="text-sm text-muted">{t('auth.twoFactorPrompt')}</p>
            <Field
              label={t('auth.code')}
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" className="w-full">
              {t('auth.verify')}
            </Button>
          </form>
        ) : (
          <form onSubmit={onLogin} className="space-y-4">
            <Field
              label={t('auth.email')}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Field
              label={t('auth.password')}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" className="w-full">
              {t('auth.login')}
            </Button>
          </form>
        )}

        <a
          href="/api/auth/oauth/42"
          className="mt-4 block rounded-[20px] bg-raised py-3 text-center font-display font-bold shadow-clay-sm active:shadow-clay-in"
        >
          {t('auth.with42')}
        </a>
        <Link to="/signup" className="mt-5 block text-center text-sm text-muted underline underline-offset-2">
          {t('auth.needAccount')}
        </Link>
      </Card>
    </div>
  );
}
