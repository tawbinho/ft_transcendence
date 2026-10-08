import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BanIcon } from '@/components/icons';
import { Alert, Button, ConfirmDialog, type ButtonSize, type ButtonVariant } from '@/components/ui';
import { useErrorMessage } from '@/lib/errorMessage';
import { useBlock, useUnblock } from '../hooks';

/** Block (after a confirmation) or unblock a player. */
export function BlockButton({
  player,
  blocked,
  size = 'md',
  variant = 'ghost',
}: {
  player: { id: string; displayName: string };
  blocked: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
}) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const block = useBlock();
  const unblock = useUnblock();
  const [confirming, setConfirming] = useState(false);
  const error = block.error ?? unblock.error;

  return (
    <>
      {blocked ? (
        <Button size={size} variant={variant} loading={unblock.isPending} onClick={() => unblock.mutate(player.id)}>
          <BanIcon />
          {t('block.unblock')}
        </Button>
      ) : (
        <Button size={size} variant={variant} onClick={() => setConfirming(true)}>
          <BanIcon />
          {t('block.block')}
        </Button>
      )}
      {error && <Alert tone="danger">{errorMessage(error)}</Alert>}
      <ConfirmDialog
        open={confirming}
        title={t('block.confirmTitle', { name: player.displayName })}
        confirmLabel={t('block.block')}
        confirmVariant="danger"
        loading={block.isPending}
        onClose={() => setConfirming(false)}
        onConfirm={() => block.mutate(player.id, { onSettled: () => setConfirming(false) })}
      >
        {t('block.confirmBody')}
      </ConfirmDialog>
    </>
  );
}
