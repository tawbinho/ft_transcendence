import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckIcon, CloseIcon, UserMinusIcon, UserPlusIcon } from '@/components/icons';
import { Alert, Button, ConfirmDialog, type ButtonSize } from '@/components/ui';
import { useAddFriend, useRemoveFriend } from '@/features/friends/hooks';
import { useErrorMessage } from '@/lib/errorMessage';
import type { Friendship } from '../types';

/**
 * The friend buttons that fit how the viewer and this player relate:
 * add, cancel a request, accept or decline theirs, or remove a friend.
 */
export function FriendActions({
  player,
  friendship,
  size = 'md',
}: {
  player: { id: string; displayName: string };
  friendship: Friendship;
  size?: ButtonSize;
}) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const add = useAddFriend();
  const remove = useRemoveFriend();
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const busy = add.isPending || remove.isPending;
  const error = add.error ?? remove.error;

  if (friendship === 'self') return null;

  const addButton = (label: string, icon = <UserPlusIcon />) => (
    <Button size={size} loading={add.isPending} disabled={busy} onClick={() => add.mutate(player.id)}>
      {icon}
      {label}
    </Button>
  );
  const removeButton = (label: string, icon = <CloseIcon />) => (
    <Button
      size={size}
      variant="secondary"
      loading={remove.isPending}
      disabled={busy}
      onClick={() => remove.mutate(player.id)}
    >
      {icon}
      {label}
    </Button>
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {friendship === 'none' && addButton(t('friends.add'))}
        {friendship === 'request_sent' && removeButton(t('friends.cancelRequest'))}
        {friendship === 'request_received' && (
          <>
            {addButton(t('friends.accept'), <CheckIcon />)}
            {removeButton(t('friends.decline'))}
          </>
        )}
        {friendship === 'friends' && (
          <Button size={size} variant="secondary" disabled={busy} onClick={() => setConfirmingRemove(true)}>
            <UserMinusIcon />
            {t('friends.remove')}
          </Button>
        )}
      </div>
      {error && <Alert tone="danger">{errorMessage(error)}</Alert>}
      <ConfirmDialog
        open={confirmingRemove}
        title={t('friends.removeTitle', { name: player.displayName })}
        confirmLabel={t('friends.remove')}
        confirmVariant="danger"
        loading={remove.isPending}
        onClose={() => setConfirmingRemove(false)}
        onConfirm={() => remove.mutate(player.id, { onSettled: () => setConfirmingRemove(false) })}
      >
        {t('friends.removeBody')}
      </ConfirmDialog>
    </div>
  );
}
