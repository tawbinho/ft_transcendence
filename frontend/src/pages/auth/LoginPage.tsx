import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';
import { Alert, Button, TextField } from '@/components/ui';
import { useLogin, useVerifyTwoFactor } from '@/features/auth/hooks';
import { normalizeCode, validateCode, validateEmail } from '@/features/auth/validation';
import { useErrorMessage } from '@/lib/errorMessage';
import { AuthLayout } from '@/layout/AuthLayout';

// After a successful login, GuestOnly (app/guards.tsx) sends the user on to
// the page they came from.
export function LoginPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const errorMessage = useErrorMessage();
  const login = useLogin();
  const verify = useVerifyTwoFactor();

  const [step, setStep] = useState<'credentials' | 'code'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const emailError = submitted ? validateEmail(email) : null;
  const passwordError = submitted && !password ? 'validation.required' : null;
  const codeError = submitted ? validateCode(code) : null;

  function submitCredentials(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (validateEmail(email) || !password) return;
    login.mutate(
      { email: email.trim(), password },
      {
        onSuccess: (result) => {
          if (!result.user) {
            setStep('code');
            setSubmitted(false);
          }
        },
      },
    );
  }

  function submitCode(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (validateCode(code)) return;
    verify.mutate(normalizeCode(code));
  }

  function backToCredentials() {
    setStep('credentials');
    setCode('');
    setPassword('');
    setSubmitted(false);
    login.reset();
    verify.reset();
  }

  if (step === 'code') {
    return (
      <AuthLayout title={t('auth.twoFactorTitle')} subtitle={t('auth.twoFactorBody')}>
        <form onSubmit={submitCode} noValidate className="flex flex-col gap-4">
          {verify.error && <Alert tone="danger">{errorMessage(verify.error)}</Alert>}
          <TextField
            label={t('auth.code')}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            error={codeError && t(codeError)}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={7}
            autoFocus
            required
          />
          <Button type="submit" size="lg" block loading={verify.isPending}>
            {t('auth.verify')}
          </Button>
          <Button variant="ghost" onClick={backToCredentials}>
            {t('auth.backToLogin')}
          </Button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={t('auth.loginTitle')}
      subtitle={t('auth.loginSubtitle')}
      footer={
        <>
          {t('auth.noAccount')}{' '}
          <Link to="/signup" state={location.state} className="font-semibold text-primary hover:underline">
            {t('nav.signup')}
          </Link>
        </>
      }
    >
      <form onSubmit={submitCredentials} noValidate className="flex flex-col gap-4">
        {login.error && <Alert tone="danger">{errorMessage(login.error)}</Alert>}
        <TextField
          label={t('auth.email')}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={emailError && t(emailError)}
          autoComplete="email"
          autoFocus
          required
        />
        <TextField
          label={t('auth.password')}
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={passwordError && t(passwordError)}
          autoComplete="current-password"
          required
        />
        <Button type="submit" size="lg" block loading={login.isPending}>
          {t('auth.loginAction')}
        </Button>
      </form>
    </AuthLayout>
  );
}
