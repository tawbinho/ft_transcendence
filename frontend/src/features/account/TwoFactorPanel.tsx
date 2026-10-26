import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Badge, Button, Card, Skeleton, TextField } from '@/components/ui';
import {
  useDisableTwoFactor,
  useEnableTwoFactor,
  useSendTwoFactorCode,
  useTwoFactorStatus,
} from '@/features/auth/hooks';
import { normalizeCode, validateCode } from '@/features/auth/validation';
import { isApiError } from '@/lib/api/errors';
import { useErrorMessage } from '@/lib/errorMessage';

type Step = { kind: 'idle' } | { kind: 'setup' } | { kind: 'disable' };

/**
 * Turns two-factor authentication on or off: a code is emailed each time, and typing it confirms.
 */
export function TwoFactorPanel() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const sendCode = useSendTwoFactorCode();
  const enable = useEnableTwoFactor();
  const disable = useDisableTwoFactor();
  const statusQuery = useTwoFactorStatus();
  const status = statusQuery.data;

  const [step, setStep] = useState<Step>({ kind: 'idle' });
  const [code, setCode] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const codeError = submitted ? validateCode(code) : null;

  function reset(next: Step = { kind: 'idle' }) {
    setStep(next);
    setCode('');
    setSubmitted(false);
    enable.reset();
    disable.reset();
  }

  // Emails a code, then shows the form to type it.
  function askForCode(next: 'setup' | 'disable') {
    setNotice(null);
    sendCode.mutate(undefined, { onSuccess: () => reset({ kind: next }) });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (validateCode(code)) return;
    if (step.kind === 'setup') {
      enable.mutate(normalizeCode(code), {
        onSuccess: () => {
          setNotice(t('twoFactor.enabled'));
          reset();
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
      {sendCode.error && <Alert tone="danger">{errorMessage(sendCode.error)}</Alert>}

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
            <Button variant="secondary" loading={sendCode.isPending} onClick={() => askForCode('disable')}>
              {t('twoFactor.turnOff')}
            </Button>
          ) : (
            <Button loading={sendCode.isPending} onClick={() => askForCode('setup')}>
              {t('twoFactor.turnOn')}
            </Button>
          )}
        </div>
      )}

      {(step.kind === 'setup' || step.kind === 'disable') && (
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <p>{step.kind === 'setup' ? t('twoFactor.emailed') : t('twoFactor.offBody')}</p>
          {pending.error && !isApiError(pending.error, 'TWO_FACTOR_NOT_ENABLED') && (
            <Alert tone="danger">{errorMessage(pending.error)}</Alert>
          )}
          <TextField
            label={t('auth.code')}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            error={codeError && t(codeError)}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={7}
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
