import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';
import { Alert, Button, TextField } from '@/components/ui';
import { useSignup } from '@/features/auth/hooks';
import {
  validateDisplayName,
  validateEmail,
  validateNewPassword,
  validatePasswordConfirmation,
} from '@/features/auth/validation';
import { isApiError } from '@/lib/api/errors';
import { useErrorMessage } from '@/lib/errorMessage';
import { AuthLayout } from '@/layout/AuthLayout';

export function SignupPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const errorMessage = useErrorMessage();
  const signup = useSignup();

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const errors = {
    email: validateEmail(email),
    displayName: validateDisplayName(displayName),
    password: validateNewPassword(password),
    confirmation: validatePasswordConfirmation(password, confirmation),
  };
  const shown = (key: keyof typeof errors) => {
    const error = errors[key];
    return submitted && error ? t(error) : null;
  };

  // Conflicts reported by the server belong to a specific field.
  const emailTaken = isApiError(signup.error, 'EMAIL_TAKEN');
  const nameTaken = isApiError(signup.error, 'DISPLAY_NAME_TAKEN');
  const formError = signup.error && !emailTaken && !nameTaken ? errorMessage(signup.error) : null;

  function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;
    signup.mutate({ email: email.trim(), displayName: displayName.trim(), password });
  }

  return (
    <AuthLayout
      title={t('auth.signupTitle')}
      subtitle={t('auth.signupSubtitle')}
      footer={
        <>
          {t('auth.haveAccount')}{' '}
          <Link to="/login" state={location.state} className="font-semibold text-primary hover:underline">
            {t('nav.login')}
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {formError && <Alert tone="danger">{formError}</Alert>}
        <TextField
          label={t('auth.email')}
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (emailTaken) signup.reset();
          }}
          error={shown('email') ?? (emailTaken ? errorMessage(signup.error) : null)}
          autoComplete="email"
          autoFocus
          required
        />
        <TextField
          label={t('auth.displayName')}
          value={displayName}
          onChange={(event) => {
            setDisplayName(event.target.value);
            if (nameTaken) signup.reset();
          }}
          error={shown('displayName') ?? (nameTaken ? errorMessage(signup.error) : null)}
          hint={t('auth.displayNameHint')}
          autoComplete="username"
          maxLength={20}
          required
        />
        <TextField
          label={t('auth.password')}
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={shown('password')}
          hint={t('auth.passwordHint')}
          autoComplete="new-password"
          maxLength={128}
          required
        />
        <TextField
          label={t('auth.confirmPassword')}
          type="password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          error={shown('confirmation')}
          autoComplete="new-password"
          maxLength={128}
          required
        />
        <Button type="submit" size="lg" block loading={signup.isPending}>
          {t('auth.signupAction')}
        </Button>
      </form>
    </AuthLayout>
  );
}
