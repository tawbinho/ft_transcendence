import { useCallback, useId, useRef, useState, type ReactNode } from 'react';
import { CheckIcon, ChevronDownIcon } from '@/components/icons';
import { menuItemClass } from '@/layout/header/menuStyles';
import { useDismiss } from '@/layout/header/useDismiss';
import { cn } from '@/lib/cn';
import type { Option } from './OptionGroup';

interface SelectFieldProps {
  label: ReactNode;
  value: string;
  options: readonly Option<string>[];
  onChange: (value: string) => void;
  className?: string;
}

/**
 * A labelled drop-down list that looks like the header's language menu: a button showing the current choice
 * and a panel of buttons under it. Tab moves through the choices, Escape or a click outside closes the panel,
 * and choosing one closes it and puts the focus back on the button.
 */
export function SelectField({ label, value, options, onChange, className }: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const id = useId();
  const labelId = `${id}-label`;
  const valueId = `${id}-value`;
  const panelId = `${id}-panel`;
  const close = useCallback(() => setOpen(false), []);
  const current = options.find((option) => option.value === value) ?? options[0];

  useDismiss(open, root, close);

  return (
    <div ref={root} className={cn('relative flex flex-col gap-1.5', className)}>
      <span id={labelId} className="text-sm font-semibold">
        {label}
      </span>
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-labelledby={`${labelId} ${valueId}`}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className="flex h-11 items-center justify-between gap-2 rounded-control border border-border bg-surface px-3 text-start text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        <span id={valueId}>{current?.label}</span>
        <ChevronDownIcon className={cn('text-muted transition', open && 'rotate-180')} />
      </button>
      <div
        id={panelId}
        hidden={!open}
        className="absolute inset-x-0 top-full z-40 mt-2 rounded-xl border border-border bg-surface p-1.5 shadow-lg"
      >
        <ul className="flex flex-col gap-0.5">
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                aria-current={option.value === value ? 'true' : undefined}
                onClick={() => {
                  onChange(option.value);
                  close();
                  button.current?.focus();
                }}
                className={cn(menuItemClass, option.value === value && 'bg-surface-2')}
              >
                {option.label}
                {option.value === value && <CheckIcon className="ms-auto text-primary" />}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
