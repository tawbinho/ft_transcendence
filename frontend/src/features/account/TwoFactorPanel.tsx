import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Badge, Button, Card, TextField } from '@/components/ui';
import { useDisableTwoFactor, useEnableTwoFactor, useSetupTwoFactor } from '@/features/auth/hooks';
import type { TwoFactorSetup, User } from '@/features/auth/types';
import { normalizeCode, validateCode } from '@/features/auth/validation';
import { isApiError } from '@/lib/api/errors';
import { useErrorMessage } from '@/lib/errorMessage';

type Step = { kind: 'idle' } | { kind: 'setup'; setup: TwoFactorSetup } | { kind: 'disable' };

/**
 * Turns two-factor authentication on (QR code, then a first code) or off
 * (a code). The backend does not say whether it is on yet; until it does, both
 * actions are offered and the server's answer settles it.
 */
export function TwoFactorPanel({ user }: { user: User }) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const setup = useSetupTwoFactor();
  const enable = useEnableTwoFactor();
  const disable = useDisableTwoFactor();

  const [step, setStep] = useState<Step>({ kind: 'idle' });
  const [code, setCode] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const status = user.twoFactorEnabled;
  const codeError = submitted ? validateCode(code) : null;

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
        if (isApiError(error, 'TWO_FACTOR_ALREADY_ENABLED')) setNotice(t('twoFactor.enabled'));
      },
    });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (validateCode(code)) return;
    const mutation = step.kind === 'setup' ? enable : disable;
    mutation.mutate(normalizeCode(code), {
      onSuccess: () => {
        setNotice(step.kind === 'setup' ? t('twoFactor.enabled') : t('twoFactor.disabled'));
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

      {step.kind === 'idle' && (
        <div className="flex flex-wrap gap-2">
          {status !== true && (
            <Button loading={setup.isPending} onClick={startSetup}>
              {t('twoFactor.turnOn')}
            </Button>
          )}
          {status !== false && (
            <Button
              variant="secondary"
              onClick={() => {
                setNotice(null);
                reset({ kind: 'disable' });
              }}
            >
              {t('twoFactor.turnOff')}
            </Button>
          )}
        </div>
      )}

      {step.kind !== 'idle' && (
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
