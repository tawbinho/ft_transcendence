import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';
import { Alert, Button, OtpInput, TextField } from '@/components/ui';
import { ResendCode } from '@/features/auth/components/ResendCode';
import { useResendVerification, useVerifyEmail } from '@/features/auth/hooks';
import { validateEmail } from '@/features/auth/validation';
import { useErrorMessage } from '@/lib/errorMessage';
import { AuthLayout } from '@/layout/AuthLayout';

/** Enter the 6-digit code emailed at signup (or at a refused login). */
export function VerifyEmailPage() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const location = useLocation();
  const verify = useVerifyEmail();
  const resend = useResendVerification();

  // The email comes with the redirect from signup or login; typed otherwise.
  const known = (location.state as { email?: string } | null)?.email ?? '';
  const [email, setEmail] = useState(known);
  const [code, setCode] = useState('');
  const [submitted, setSubmitted] = useState(false);
  // Bumped after a wrong code: remounts the boxes, empty, focus on the first.
  const [attempt, setAttempt] = useState(0);
  const emailError = submitted ? validateEmail(email) : null;

  function send(digits: string) {
    setSubmitted(true);
    if (validateEmail(email)) return;
    verify.mutate(
      { email: email.trim(), code: digits },
      {
        onError: () => {
          setCode('');
          setAttempt((count) => count + 1);
        },
      },
    );
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (code.length === 6) send(code);
    else setSubmitted(true);
  }

  if (verify.isSuccess) {
    return (
      <AuthLayout title={t('auth.verifyEmailTitle')} subtitle={t('auth.emailVerified')}>
        <Link to="/login" state={{ email: email.trim() }} className="font-semibold text-primary hover:underline">
          {t('nav.login')}
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={t('auth.verifyEmailTitle')}
      subtitle={known ? t('auth.verifyEmailBody', { email: known }) : t('auth.verifyEmailBody', { email: '...' })}
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        {verify.error && <Alert tone="danger">{errorMessage(verify.error)}</Alert>}
        {resend.isSuccess && <Alert tone="success">{t('auth.codeResent')}</Alert>}
        {!known && (
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
        )}
        <OtpInput
          key={attempt}
          label={t('auth.code')}
          value={code}
          onChange={setCode}
          onComplete={send}
          error={verify.error ? ' ' : null}
          autoFocus={!!known || attempt > 0}
        />
        <Button type="submit" size="lg" block loading={verify.isPending} disabled={code.length !== 6}>
          {t('auth.verify')}
        </Button>
        <ResendCode onResend={() => resend.mutate(email.trim())} loading={resend.isPending} />
      </form>
    </AuthLayout>
  );
}
