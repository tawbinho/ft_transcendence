import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Badge, Button, Card, Skeleton, TextField } from '@/components/ui';
import { useDisableTwoFactor, useEnableTwoFactor, useSetupTwoFactor, useTwoFactorStatus } from '@/features/auth/hooks';
import type { TwoFactorSetup } from '@/features/auth/types';
import { normalizeCode, validateCode, validateCodeOrBackupCode } from '@/features/auth/validation';
import { isApiError } from '@/lib/api/errors';
import { useErrorMessage } from '@/lib/errorMessage';
import { BackupCodes } from './BackupCodes';

type Step =
  | { kind: 'idle' }
  | { kind: 'setup'; setup: TwoFactorSetup }
  | { kind: 'codes'; codes: string[] }
  | { kind: 'disable' };

/**
 * Turns two-factor authentication on (QR code, then a first code, then the backup codes are shown
 * once) or off (a code from the app or a backup code).
 */
export function TwoFactorPanel() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const setup = useSetupTwoFactor();
  const enable = useEnableTwoFactor();
  const disable = useDisableTwoFactor();
  const statusQuery = useTwoFactorStatus();
  const status = statusQuery.data;

  const [step, setStep] = useState<Step>({ kind: 'idle' });
  const [code, setCode] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Turning 2FA on needs a code from the app: no backup code exists yet.
  const checkCode = step.kind === 'setup' ? validateCode : validateCodeOrBackupCode;
  const codeError = submitted ? checkCode(code) : null;

  function reset(next: Step = { kind: 'idle' }) {
    setStep(next);
    setCode('');
    setSubmitted(false);
    enable.reset();
    disable.reset();
  }

  function startSetup() {
    setNotice(null);
    setup.mutate(undefined, {
      onSuccess: (data) => reset({ kind: 'setup', setup: data }),
      onError: (error) => {
        if (isApiError(error, 'TWO_FACTOR_ALREADY_ENABLED')) {
          setNotice(t('twoFactor.enabled'));
        }
      },
    });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (checkCode(code)) return;
    if (step.kind === 'setup') {
      enable.mutate(normalizeCode(code), {
        onSuccess: ({ backupCodes }) => {
          setNotice(t('twoFactor.enabled'));
          reset({ kind: 'codes', codes: backupCodes });
        },
      });
      return;
    }
    disable.mutate(normalizeCode(code), {
      onSuccess: () => {
        setNotice(t('twoFactor.disabled'));
        reset();
      },
      onError: (error) => {
        if (isApiError(error, 'TWO_FACTOR_NOT_ENABLED')) {
          setNotice(t('twoFactor.disabled'));
          reset();
        }
      },
    });
  }

  const pending = step.kind === 'setup' ? enable : disable;
  const setupError = setup.error && !isApiError(setup.error, 'TWO_FACTOR_ALREADY_ENABLED') ? setup.error : null;

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">{t('twoFactor.title')}</h2>
        {status !== undefined && (
          <Badge tone={status ? 'success' : 'neutral'}>{status ? t('twoFactor.on') : t('twoFactor.off')}</Badge>
        )}
      </div>
      <p className="text-muted">{t('twoFactor.body')}</p>

      {notice && <Alert tone="success">{notice}</Alert>}
      {setupError && <Alert tone="danger">{errorMessage(setupError)}</Alert>}

      {/* The server has not answered yet: a placeholder, or a retry if it could not be asked. */}
      {step.kind === 'idle' && status === undefined && statusQuery.isError && (
        <Alert
          tone="danger"
          action={
            <Button
              size="sm"
              variant="secondary"
              loading={statusQuery.isFetching}
              onClick={() => void statusQuery.refetch()}
            >
              {t('common.retry')}
            </Button>
          }
        >
          {errorMessage(statusQuery.error)}
        </Alert>
      )}
      {step.kind === 'idle' && status === undefined && !statusQuery.isError && <Skeleton className="h-10 w-32" />}
      {step.kind === 'idle' && status !== undefined && (
        <div className="flex flex-wrap gap-2">
          {status ? (
            <Button
              variant="secondary"
              onClick={() => {
                setNotice(null);
                reset({ kind: 'disable' });
              }}
            >
              {t('twoFactor.turnOff')}
            </Button>
          ) : (
            <Button loading={setup.isPending} onClick={startSetup}>
              {t('twoFactor.turnOn')}
            </Button>
          )}
        </div>
      )}

      {step.kind === 'codes' && <BackupCodes codes={step.codes} onDone={() => reset()} />}

      {(step.kind === 'setup' || step.kind === 'disable') && (
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          {step.kind === 'setup' ? (
            <>
              <p>{t('twoFactor.scan')}</p>
              <img
                src={step.setup.qr}
                alt={t('twoFactor.qrAlt')}
                width={200}
                height={200}
                className="rounded-xl border border-border bg-white p-2"
              />
              <div className="text-sm">
                <p className="text-muted">{t('twoFactor.manualKey')}</p>
                <code dir="ltr" className="mt-1 inline-block rounded-lg bg-surface-2 px-2 py-1 font-mono break-all">
                  {step.setup.secret}
                </code>
              </div>
            </>
          ) : (
            <p>{t('twoFactor.offBody')}</p>
          )}
          {pending.error && !isApiError(pending.error, 'TWO_FACTOR_NOT_ENABLED') && (
            <Alert tone="danger">{errorMessage(pending.error)}</Alert>
          )}
          <TextField
            label={t('auth.code')}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            error={codeError && t(codeError)}
            // A backup code has letters: the number keypad only while turning 2FA on.
            inputMode={step.kind === 'setup' ? 'numeric' : 'text'}
            autoComplete="one-time-code"
            maxLength={step.kind === 'setup' ? 7 : 11}
            autoFocus
            className="max-w-xs"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant={step.kind === 'disable' ? 'danger' : 'primary'} loading={pending.isPending}>
              {step.kind === 'setup' ? t('twoFactor.confirmOn') : t('twoFactor.confirmOff')}
            </Button>
            <Button variant="ghost" onClick={() => reset()}>
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
