import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Button, TextField } from '@/components/ui';
import type { User } from '@/features/auth/types';
import { DISPLAY_NAME_MAX, validateDisplayName } from '@/features/auth/validation';
import { useUpdateProfile } from '@/features/users/hooks';
import { isApiError } from '@/lib/api/errors';
import { useErrorMessage } from '@/lib/errorMessage';

/** Edits the display name; the rules are checked here before the server is asked. */
export function DisplayNameForm({ user }: { user: User }) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const update = useUpdateProfile();
  const [name, setName] = useState(user.displayName);
  const [submitted, setSubmitted] = useState(false);
  const unchanged = name.trim() === user.displayName;

  const localError = submitted ? validateDisplayName(name) : null;
  const error = localError
    ? t(localError)
    : isApiError(update.error, 'DISPLAY_NAME_TAKEN') || isApiError(update.error, 'VALIDATION_ERROR')
      ? errorMessage(update.error)
      : null;

  function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (unchanged || validateDisplayName(name)) return;
    update.mutate({ displayName: name.trim() });
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3">
      <TextField
        label={t('account.displayName')}
        hint={t('account.displayNameHint')}
        value={name}
        maxLength={DISPLAY_NAME_MAX}
        autoComplete="nickname"
        spellCheck={false}
        onChange={(event) => {
          setName(event.target.value);
          if (update.error) update.reset();
        }}
        error={error}
      />
      {update.error && !error && <Alert tone="danger">{errorMessage(update.error)}</Alert>}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="secondary" loading={update.isPending} disabled={unchanged}>
          {t('account.saveName')}
        </Button>
        <p role="status" className="text-sm font-semibold text-success">
          {update.isSuccess && unchanged ? t('account.nameSaved') : ''}
        </p>
      </div>
    </form>
  );
}
