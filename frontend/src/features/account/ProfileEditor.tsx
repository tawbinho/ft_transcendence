import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { CameraIcon, TrashIcon } from '@/components/icons';
import { Alert, Avatar, Button, Card, TextField } from '@/components/ui';
import type { User } from '@/features/auth/types';
import { DISPLAY_NAME_MAX, validateDisplayName } from '@/features/auth/validation';
import { AVATAR_TYPES, validateAvatarFile } from '@/features/users/avatar';
import { useRemoveAvatar, useUpdateProfile, useUploadAvatar } from '@/features/users/hooks';
import { ApiError, isApiError } from '@/lib/api/errors';
import { useErrorMessage } from '@/lib/errorMessage';
import type { ValidationKey } from '@/lib/validation';

/** The account's public face: picture and display name. */
export function ProfileEditor({ user }: { user: User }) {
  const { t } = useTranslation();
  return (
    <Card className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">{t('account.profile')}</h2>
        <Link to={paths.profile(user.displayName)} className="text-sm font-semibold text-primary hover:underline">
          {t('account.viewProfile')}
        </Link>
      </div>
      <AvatarEditor user={user} />
      <DisplayNameForm user={user} />
      <div>
        <p className="text-sm font-semibold">{t('account.email')}</p>
        <p className="truncate text-muted">{user.email}</p>
      </div>
    </Card>
  );
}

function AvatarEditor({ user }: { user: User }) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const upload = useUploadAvatar();
  const remove = useRemoveAvatar();
  const input = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<ValidationKey | null>(null);

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Cleared so that picking the same file again still triggers a change.
    event.target.value = '';
    if (!file) return;
    const problem = validateAvatarFile(file);
    setFileError(problem);
    remove.reset();
    if (!problem) upload.mutate(file);
  }

  // A file the browser cannot open as a picture fails before any request.
  const uploadError = upload.error
    ? upload.error instanceof ApiError
      ? errorMessage(upload.error)
      : t('validation.avatarUnreadable')
    : null;
  const error = fileError ? t(fileError) : (uploadError ?? (remove.error ? errorMessage(remove.error) : null));

  return (
    <div className="flex flex-wrap items-center gap-5">
      <Avatar user={user} size="xl" />
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" loading={upload.isPending} onClick={() => input.current?.click()}>
            <CameraIcon />
            {user.avatarUrl ? t('account.changePicture') : t('account.addPicture')}
          </Button>
          {user.avatarUrl && (
            <Button
              variant="ghost"
              loading={remove.isPending}
              onClick={() => {
                setFileError(null);
                upload.reset();
                remove.mutate();
              }}
            >
              <TrashIcon />
              {t('account.removePicture')}
            </Button>
          )}
        </div>
        <p className="text-sm text-muted">{t('account.pictureHint')}</p>
        <input ref={input} type="file" accept={AVATAR_TYPES.join(',')} hidden onChange={onFile} />
        {error && <Alert tone="danger">{error}</Alert>}
      </div>
    </div>
  );
}

function DisplayNameForm({ user }: { user: User }) {
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
