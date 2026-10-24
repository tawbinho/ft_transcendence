import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';
import { Alert, Button, OtpInput, TextField, buttonClass } from '@/components/ui';
import { ResendCode } from '@/features/auth/components/ResendCode';
import { PasswordField } from '@/features/auth/components/PasswordField';
import { useForgotPassword, useResetPassword } from '@/features/auth/hooks';
import {
  validateCode,
  validateEmail,
  validateNewPassword,
  validatePasswordConfirmation,
} from '@/features/auth/validation';
import { useFocusFirstInvalid } from '@/features/auth/useFocusFirstInvalid';
import { useErrorMessage } from '@/lib/errorMessage';
import { AuthLayout } from '@/layout/AuthLayout';

/** Forgot password: 1) email, we send a 6-digit code; 2) code + new password. */
export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const location = useLocation();
  const forgot = useForgotPassword();
  const reset = useResetPassword();

  const [email, setEmail] = useState((location.state as { email?: string } | null)?.email ?? '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitted, setSubmitted] = useState(false);
  // How many times a form was sent with mistakes: moves the focus to the first one.
  const [failedSubmits, setFailedSubmits] = useState(0);
  const form = useFocusFirstInvalid(failedSubmits);

  const emailError = submitted ? validateEmail(email) : null;
  const passwordError = submitted ? validateNewPassword(password) : null;
  const confirmationError = submitted ? validatePasswordConfirmation(password, confirmation) : null;
  const codeError = submitted ? validateCode(code) : null;

  function sendCode(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (validateEmail(email)) {
      setFailedSubmits((count) => count + 1);
      return;
    }
    forgot.mutate(email.trim(), { onSuccess: () => setSubmitted(false) });
  }

  function changePassword(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (validateCode(code) || validateNewPassword(password) || validatePasswordConfirmation(password, confirmation)) {
      setFailedSubmits((count) => count + 1);
      return;
    }
    reset.mutate({ email: email.trim(), code, password });
  }

  if (reset.isSuccess) {
    return (
      <AuthLayout title={t('auth.resetTitle')} subtitle={t('auth.passwordChanged')}>
        <Link to="/login" className={buttonClass({ block: true })}>
          {t('nav.login')}
        </Link>
      </AuthLayout>
    );
  }

  // Step 2 (shown even if the account does not exist: the server never says).
  if (forgot.isSuccess) {
    return (
      <AuthLayout title={t('auth.resetTitle')} subtitle={t('auth.resetCodeBody', { email: email.trim() })}>
        <form ref={form} onSubmit={changePassword} noValidate className="flex flex-col gap-5">
          {reset.error && <Alert tone="danger">{errorMessage(reset.error)}</Alert>}
          <OtpInput
            label={t('auth.code')}
            value={code}
            onChange={setCode}
            error={codeError && t(codeError)}
            autoFocus
          />
          <PasswordField
            label={t('auth.newPassword')}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={passwordError && t(passwordError)}
            hint={t('auth.passwordHint')}
            autoComplete="new-password"
            required
          />
          <PasswordField
            label={t('auth.confirmPassword')}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            error={confirmationError && t(confirmationError)}
            autoComplete="new-password"
            required
          />
          <Button type="submit" size="lg" block loading={reset.isPending}>
            {t('auth.resetAction')}
          </Button>
          <ResendCode onResend={() => forgot.mutate(email.trim())} loading={forgot.isPending} />
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={t('auth.resetTitle')} subtitle={t('auth.resetEmailBody')}>
      <form ref={form} onSubmit={sendCode} noValidate className="flex flex-col gap-4">
        {forgot.error && <Alert tone="danger">{errorMessage(forgot.error)}</Alert>}
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
        <Button type="submit" size="lg" block loading={forgot.isPending}>
          {t('auth.sendCode')}
        </Button>
        <Link to="/login" className="text-center text-sm font-semibold text-primary hover:underline">
          {t('nav.login')}
        </Link>
      </form>
    </AuthLayout>
  );
}
