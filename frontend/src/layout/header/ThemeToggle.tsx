import { useTranslation } from 'react-i18next';
import { MoonIcon, SunIcon } from '@/components/icons';
import { IconButton } from '@/components/ui';
import { setColorScheme, useResolvedTheme } from '@/lib/colorScheme';

/** Switches between the light and the dark theme; it shows the one you would get. */
export function ThemeToggle() {
  const { t } = useTranslation();
  const dark = useResolvedTheme() === 'dark';
  return (
    <IconButton
      label={dark ? t('nav.themeToLight') : t('nav.themeToDark')}
      onClick={() => setColorScheme(dark ? 'light' : 'dark')}
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </IconButton>
  );
}
