import { useRef, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { CameraIcon, TrashIcon } from '@/components/icons';
import { Alert, Avatar, Button } from '@/components/ui';
import type { User } from '@/features/auth/types';
import { AVATAR_TYPES, validateAvatarFile } from '@/features/users/avatar';
import { useRemoveAvatar, useUploadAvatar } from '@/features/users/hooks';
import { ApiError } from '@/lib/api/errors';
import { useErrorMessage } from '@/lib/errorMessage';
import type { ValidationKey } from '@/lib/validation';

/** The current picture with buttons to add, change or remove it. */
export function AvatarEditor({ user }: { user: User }) {
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
