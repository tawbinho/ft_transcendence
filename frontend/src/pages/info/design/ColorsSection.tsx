import { useTranslation } from 'react-i18next';
import { AccentPicker } from '@/components/AccentPicker';
import { DiscIcon } from '@/features/game/components/DiscIcon';
import { BOARD_THEMES } from '@/features/game/settings';
import { useAccent } from '@/lib/accent';

type Theme = 'light' | 'dark';

// Each color with the color its sample text uses (the pair the components really use).
const GROUPS = [
  {
    id: 'surfaces',
    colors: [
      ['bg', 'fg'],
      ['surface', 'fg'],
      ['surface-2', 'fg'],
      ['border', 'fg'],
    ],
  },
  {
    id: 'text',
    colors: [
      ['fg', 'bg'],
      ['muted', 'bg'],
    ],
  },
  {
    id: 'brand',
    colors: [
      ['primary', 'primary-fg'],
      ['primary-hover', 'primary-fg'],
      ['ring', 'bg'],
    ],
  },
  {
    id: 'status',
    colors: [
      ['success', 'surface'],
      ['warning', 'surface'],
      ['danger', 'danger-fg'],
      ['success-soft', 'success'],
      ['warning-soft', 'warning'],
      ['danger-soft', 'danger'],
    ],
  },
] as const;

/** The palette of one theme. Setting data-theme here makes the tokens inside take that theme's values. */
function ThemePalette({ theme }: { theme: Theme }) {
  const { t } = useTranslation();
  const [accent] = useAccent();
  return (
    <div
      data-theme={theme}
      data-accent={accent === 'blue' ? undefined : accent}
      className="min-w-0 rounded-card border border-border bg-bg p-5 text-fg"
    >
      <h3 className="text-lg font-bold">{t(`design.colors.${theme}`)}</h3>
      {GROUPS.map((group) => (
        <div key={group.id} className="mt-4">
          <h4 className="mb-2 text-sm font-semibold text-muted">{t(`design.colors.${group.id}`)}</h4>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {group.colors.map(([name, text]) => (
              <li key={name} className="min-w-0">
                <span
                  className="grid h-12 place-items-center rounded-lg border border-border font-bold"
                  style={{ background: `var(--c-${name})`, color: `var(--c-${text})` }}
                >
                  Aa
                </span>
                <code dir="ltr" className="mt-1 block truncate text-xs text-muted">
                  --c-{name}
                </code>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** Both palettes side by side, the four board themes and the accent color picker. */
export function ColorsSection() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 lg:grid-cols-2">
        <ThemePalette theme="light" />
        <ThemePalette theme="dark" />
      </div>

      <div>
        <h3 className="text-lg font-bold">{t('design.colors.boardThemes')}</h3>
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {BOARD_THEMES.map((theme) => (
            <li key={theme} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
              <span className="flex gap-1 text-2xl">
                <DiscIcon seat={1} theme={theme} />
                <DiscIcon seat={2} theme={theme} />
              </span>
              <span className="font-semibold">{t(`themes.${theme}.name`)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="max-w-xl">
        <AccentPicker />
        <p className="mt-2 text-sm text-muted">{t('design.colors.accentHint')}</p>
      </div>
    </div>
  );
}
