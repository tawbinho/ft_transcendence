import { useTranslation } from 'react-i18next';
import { OptionGroup } from '@/components/ui';
import { ACCENTS, ACCENT_PREVIEW, useAccent, type Accent } from '@/lib/accent';

/** A small round preview of an accent: its light-theme color on one half, its dark-theme color on the other. */
function Swatch({ accent }: { accent: Accent }) {
  const { light, dark } = ACCENT_PREVIEW[accent];
  return (
    <span
      aria-hidden="true"
      className="size-4 flex-none rounded-full border border-fg/25"
      style={{ background: `linear-gradient(135deg, ${light} 50%, ${dark} 50%)` }}
    />
  );
}

/** Lets the member choose the accent color of buttons, links and active tabs (saved on this device). */
export function AccentPicker({ className }: { className?: string }) {
  const { t } = useTranslation();
  const [accent, setAccent] = useAccent();

  return (
    <OptionGroup
      className={className}
      legend={t('accent.label')}
      value={accent}
      onChange={setAccent}
      options={ACCENTS.map((value) => ({
        value,
        label: (
          <span className="flex items-center gap-2">
            <Swatch accent={value} />
            {t(`accent.${value}`)}
          </span>
        ),
      }))}
    />
  );
}
