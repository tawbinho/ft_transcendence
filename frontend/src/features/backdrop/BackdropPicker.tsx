import { OptionGroup } from '@/components/ui';
import { useLanguage } from '@/i18n';
import { BACKDROPS, useBackdrop } from './backdrops';
import { TEXTS } from './texts';

/** Lets the member choose the background of every page (saved on this device). Sits next to the accent color. */
export function BackdropPicker() {
  const [language] = useLanguage();
  const [backdrop, setBackdrop] = useBackdrop();
  const text = TEXTS[language];

  return (
    <OptionGroup
      legend={text.label}
      variant="cards"
      value={backdrop}
      onChange={setBackdrop}
      options={BACKDROPS.map((value) => ({
        value,
        label: (
          <span className="flex items-center gap-3">
            {/* A small piece of the real background, drawn by the same rule as the page (backdrop.css). */}
            <span
              aria-hidden="true"
              data-backdrop-preview={value}
              className="h-10 w-14 flex-none rounded-lg border border-border bg-bg"
            />
            {text.names[value]}
          </span>
        ),
      }))}
    />
  );
}
