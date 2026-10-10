import { useId, useState, type InputHTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> {
  label: string;
  hint?: string;
  /** Shown under the field and linked to it for screen readers. */
  error?: string | null;
}

/** A password input with a button that shows or hides what was typed. */
export function PasswordField({ label, hint, error, className, ...props }: PasswordFieldProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
          className={cn(
            'h-11 w-full rounded-xl border bg-surface ps-3 pe-20 text-fg',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
            error ? 'border-danger' : 'border-border',
          )}
          {...props}
        />
        <button
          type="button"
          aria-label={visible ? t('auth.hidePasswordLabel') : t('auth.showPasswordLabel')}
          onClick={() => setVisible((value) => !value)}
          className="absolute inset-y-1 end-1 rounded-lg px-3 text-sm font-semibold text-primary hover:bg-surface-2"
        >
          {visible ? t('auth.hidePassword') : t('auth.showPassword')}
        </button>
      </div>
      {error && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
