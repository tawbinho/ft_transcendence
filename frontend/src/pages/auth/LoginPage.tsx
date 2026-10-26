import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';
import { returnPath } from '@/app/guards';
import { Alert, Button, TextField } from '@/components/ui';
import { LoginHint } from '@/features/auth/components/LoginHint';
import { PasswordField } from '@/features/auth/components/PasswordField';
import { useLogin, useVerifyTwoFactor } from '@/features/auth/hooks';
import { useFocusFirstInvalid } from '@/features/auth/useFocusFirstInvalid';
import { normalizeCode, validateCode, validateEmail, validateLoginPassword } from '@/features/auth/validation';
import { isApiError } from '@/lib/api/errors';
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
  // How many times the form was sent with mistakes: moves the focus to the first one.
  const [failedSubmits, setFailedSubmits] = useState(0);
  const form = useFocusFirstInvalid(failedSubmits);
  // A visitor sent here from another page (not one who opened the login page themselves) gets a short note.
  const sentHere = returnPath(location) !== null;

  const emailError = submitted ? validateEmail(email) : null;
  const passwordError = submitted ? validateLoginPassword(password) : null;
  const codeError = submitted ? validateCode(code) : null;

  function submitCredentials(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (validateEmail(email) || validateLoginPassword(password)) {
      setFailedSubmits((count) => count + 1);
      return;
    }
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
    if (validateCode(code)) {
      setFailedSubmits((count) => count + 1);
      return;
    }
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
        <form ref={form} onSubmit={submitCode} noValidate className="flex flex-col gap-4">
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
      <form ref={form} onSubmit={submitCredentials} noValidate className="flex flex-col gap-4">
        {sentHere && <LoginHint />}
        {login.error && (
          <Alert tone="danger">
            {errorMessage(login.error)}
            {isApiError(login.error, 'EMAIL_NOT_VERIFIED') && (
              <>
                {' '}
                <Link to="/verify-email" state={{ email: email.trim() }} className="font-semibold underline">
                  {t('auth.verifyEmailLogin')}
                </Link>
              </>
            )}
          </Alert>
        )}
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
        <PasswordField
          label={t('auth.password')}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={passwordError && t(passwordError)}
          autoComplete="current-password"
          required
        />
        <Button type="submit" size="lg" block loading={login.isPending}>
          {t('auth.loginAction')}
        </Button>
        <Link
          to="/forgot-password"
          state={{ email: email.trim() }}
          className="text-center text-sm font-semibold text-primary hover:underline"
        >
          {t('auth.forgotPassword')}
        </Link>
      </form>
    </AuthLayout>
  );
}
