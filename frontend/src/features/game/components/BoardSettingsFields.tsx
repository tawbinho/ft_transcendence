import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { OptionGroup, RangeField } from '@/components/ui';
import {
  BOARD_LIMITS,
  BOARD_THEMES,
  DEFAULT_BOARD_SETTINGS,
  maxWinLength,
  normalizeSettings,
  type BoardSettings,
} from '../settings';
import { DiscIcon } from './DiscIcon';

/** Board size, line length and colors. Always reports valid settings. */
export function BoardSettingsFields({
  value,
  onChange,
}: {
  value: BoardSettings;
  onChange: (settings: BoardSettings) => void;
}) {
  const { t } = useTranslation();
  const headingId = useId();
  const update = (patch: Partial<BoardSettings>) => onChange(normalizeSettings({ ...value, ...patch }));

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-2">
        <h2 id={headingId} className="text-lg font-bold">
          {t('board.title')}
        </h2>
        <button
          type="button"
          className="text-sm font-semibold text-primary hover:underline disabled:text-muted disabled:no-underline"
          disabled={
            value.cols === DEFAULT_BOARD_SETTINGS.cols &&
            value.rows === DEFAULT_BOARD_SETTINGS.rows &&
            value.winLength === DEFAULT_BOARD_SETTINGS.winLength
          }
          onClick={() => update({ cols: 7, rows: 6, winLength: 4 })}
        >
          {t('board.reset')}
        </button>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <RangeField
          label={t('board.cols')}
          value={value.cols}
          min={BOARD_LIMITS.cols.min}
          max={BOARD_LIMITS.cols.max}
          onChange={(cols) => update({ cols })}
        />
        <RangeField
          label={t('board.rows')}
          value={value.rows}
          min={BOARD_LIMITS.rows.min}
          max={BOARD_LIMITS.rows.max}
          onChange={(rows) => update({ rows })}
        />
        <RangeField
          label={t('board.winLength')}
          value={value.winLength}
          min={BOARD_LIMITS.winLength.min}
          max={maxWinLength(value.cols, value.rows)}
          onChange={(winLength) => update({ winLength })}
        />
      </div>
      <OptionGroup
        legend={t('board.theme')}
        value={value.theme}
        onChange={(theme) => update({ theme })}
        options={BOARD_THEMES.map((theme) => ({
          value: theme,
          label: (
            <span className="flex items-center gap-2">
              <span className="flex -space-x-1.5 rtl:space-x-reverse">
                <DiscIcon seat={1} theme={theme} />
                <DiscIcon seat={2} theme={theme} />
              </span>
              {t(`themes.${theme}.name`)}
            </span>
          ),
        }))}
      />
    </section>
  );
}
