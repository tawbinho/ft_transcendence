import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { PublicUser } from '@cf/shared';
import { api, ApiClientError } from '../lib/api';
import { useAuth } from '../features/auth/AuthContext';
import { Button, Card, Field } from '../components/ui';

export function Signup() {
  const { t } = useTranslation();
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      const result = await api.post<{ user: PublicUser | null }>('/api/auth/signup', {
        email,
        displayName,
        password,
      });
      setUser(result.user);
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : t('errors.generic'));
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <h1 className="mb-6 font-display text-3xl font-bold">{t('auth.signup')}</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field
            label={t('auth.displayName')}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            minLength={2}
            maxLength={20}
            required
          />
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" className="w-full">
            {t('auth.signup')}
          </Button>
        </form>
        <Link to="/login" className="mt-5 block text-center text-sm text-muted underline underline-offset-2">
          {t('auth.haveAccount')}
        </Link>
      </Card>
    </div>
  );
}
