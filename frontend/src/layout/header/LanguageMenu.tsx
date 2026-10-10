import { useCallback, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckIcon, ChevronDownIcon, GlobeIcon } from '@/components/icons';
import { LANGUAGES, useLanguage } from '@/i18n';
import { cn } from '@/lib/cn';
import { menuItemClass, menuPanelClass } from './menuStyles';
import { useDismiss } from './useDismiss';

/**
 * The language button of the header and the list it opens. Built like AccountMenu: a button, a panel of
 * buttons, Tab moves through them, Escape or a click outside closes it. Choosing a language closes the
 * list and puts the focus back on the button.
 */
export function LanguageMenu() {
  const { t } = useTranslation();
  const [language, setLanguage] = useLanguage();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const close = useCallback(() => setOpen(false), []);
  const current = LANGUAGES.find((entry) => entry.code === language) ?? LANGUAGES[0];

  useDismiss(open, root, close);

  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 items-center gap-2 rounded-xl px-2.5 font-semibold hover:bg-surface-2"
      >
        <GlobeIcon className="text-muted" />
        <span className="sr-only">{t('preferences.language')}:</span>
        <span lang={current.code}>{current.label}</span>
        <ChevronDownIcon className={cn('text-muted transition', open && 'rotate-180')} />
      </button>
      <div id={panelId} hidden={!open} className={menuPanelClass}>
        <ul className="flex flex-col gap-0.5">
          {LANGUAGES.map(({ code, label }) => (
            <li key={code}>
              <button
                type="button"
                lang={code}
                aria-current={code === language ? 'true' : undefined}
                onClick={() => {
                  setLanguage(code);
                  close();
                  button.current?.focus();
                }}
                className={cn(menuItemClass, code === language && 'bg-surface-2')}
              >
                {label}
                {code === language && <CheckIcon className="ms-auto text-primary" />}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
