import { useTranslation } from 'react-i18next';
import { OptionGroup } from '@/components/ui';
import { COLOR_SCHEMES, useColorScheme } from '@/lib/colorScheme';

/** System, light or dark as a row of buttons, like the language next to it. */
export function ColorSchemePicker({ className }: { className?: string }) {
  const { t } = useTranslation();
  const [scheme, setScheme] = useColorScheme();

  return (
    <OptionGroup
      className={className}
      legend={t('preferences.appearance')}
      value={scheme}
      onChange={setScheme}
      options={COLOR_SCHEMES.map((value) => ({ value, label: t(`preferences.${value}`) }))}
    />
  );
}
