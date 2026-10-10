import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';
import { cn } from '@/lib/cn';

type Variant = 'ghost' | 'secondary';

interface Shared {
  /** What the button does. Read aloud, and shown as a tooltip, since the button only has an icon. */
  label: string;
  /** The icon. */
  children: ReactNode;
  variant?: Variant;
  className?: string;
}

// With `to` the control is a link, without it a button.
type ButtonProps = Shared & Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof Shared> & { to?: undefined };
type LinkButtonProps = Shared & Omit<LinkProps, keyof Shared> & { to: string };

const VARIANTS: Record<Variant, string> = {
  ghost: 'text-fg hover:bg-surface-2',
  secondary: 'border border-border bg-surface text-fg hover:bg-surface-2',
};

/** A square control that only shows an icon. The label is required so it always has an accessible name. */
export function IconButton(props: ButtonProps | LinkButtonProps) {
  const { label, variant = 'ghost', className, children, ...rest } = props;
  const classes = cn(
    'relative inline-flex size-11 flex-none select-none items-center justify-center rounded-xl text-xl transition',
    'disabled:cursor-not-allowed disabled:opacity-55',
    VARIANTS[variant],
    className,
  );

  if (rest.to !== undefined) {
    return (
      <Link {...rest} aria-label={label} title={label} className={classes}>
        {children}
      </Link>
    );
  }
  const { to: _to, ...buttonProps } = rest;
  return (
    <button type="button" {...buttonProps} aria-label={label} title={label} className={classes}>
      {children}
    </button>
  );
}
