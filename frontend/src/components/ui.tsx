import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'accent' | 'danger';

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'bg-gradient-to-b from-[#ff8f66] to-disc1 text-white',
  accent: 'bg-accent-strong text-white',
  secondary: 'bg-raised text-ink',
  danger: 'bg-danger text-white',
};

export function Button({
  variant = 'accent',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`font-display font-bold rounded-[20px] px-6 py-3 shadow-clay transition
        hover:-translate-y-0.5 active:translate-y-px active:shadow-clay-in active:scale-[0.98]
        disabled:opacity-60 disabled:pointer-events-none ${VARIANT_CLASS[variant]} ${className}`}
      {...props}
    />
  );
}

export function Card({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`bg-raised rounded-clay shadow-clay p-6 ${className}`}>{children}</div>
  );
}

export function Field({
  label,
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="block text-sm text-muted mb-1 ms-1">{label}</span>
      <input
        className={`w-full rounded-[16px] bg-raised px-4 py-3 text-ink shadow-clay-in
          outline-none focus-visible:ring-2 focus-visible:ring-accent-strong ${className}`}
        {...props}
      />
    </label>
  );
}

export function Select({
  label,
  className = '',
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm text-muted mb-1 ms-1">{label}</span>
      <select
        className={`w-full rounded-[16px] bg-raised px-4 py-3 text-ink shadow-clay-in outline-none ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Spinner() {
  return (
    <div
      className="mx-auto my-8 h-8 w-8 animate-spin rounded-full border-4 border-well border-t-accent-strong"
      role="status"
      aria-label="Loading"
    />
  );
}
