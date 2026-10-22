import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, OptionGroup } from '@/components/ui';
import { loadLastSettings, saveLastSettings } from '@/features/game/lastSettings';
import { BOARD_THEMES, type BoardTheme } from '@/features/game/settings';
import { ColorSchemePicker } from '@/layout/ColorSchemePicker';
import { LanguagePicker } from '@/layout/LanguagePicker';

/** Language, light or dark, and the board colors new games start with. All kept on this device. */
export function PreferencesSection() {
  const { t } = useTranslation();
  const [theme, setTheme] = useState<BoardTheme>(() => loadLastSettings().theme);

  function chooseTheme(next: BoardTheme) {
    setTheme(next);
    // Only the colors change; the board size and line length stay as they were.
    saveLastSettings({ ...loadLastSettings(), theme: next });
  }

  return (
    <>
      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">{t('account.appearance')}</h2>
        <LanguagePicker />
        <ColorSchemePicker />
      </Card>

      <Card className="flex flex-col gap-4">
        <OptionGroup
          legend={<span className="text-lg font-bold">{t('account.boardTheme')}</span>}
          variant="cards"
          columns={2}
          value={theme}
          onChange={chooseTheme}
          options={BOARD_THEMES.map((id) => ({
            value: id,
            label: t(`themes.${id}.name`),
            description: `${t(`themes.${id}.seat1`)} · ${t(`themes.${id}.seat2`)}`,
          }))}
        />
        <p className="text-sm text-muted">{t('account.boardThemeHint')}</p>
      </Card>
    </>
  );
}
