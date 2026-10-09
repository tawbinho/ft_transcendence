import { useTranslation } from 'react-i18next';
import { OptionGroup } from '@/components/ui';
import { LANGUAGES, isLanguage, useLanguage } from '@/i18n';

/**
 * The language as a row of buttons, one per language, for the places with room for it (Settings and the phone
 * menu). The header uses LanguageMenu instead. Each name is written in its own language and script.
 */
export function LanguagePicker({ className }: { className?: string }) {
  const { t } = useTranslation();
  const [language, setLanguage] = useLanguage();

  return (
    <OptionGroup
      className={className}
      legend={t('preferences.language')}
      value={language}
      onChange={(code) => isLanguage(code) && setLanguage(code)}
      options={LANGUAGES.map(({ code, label }) => ({
        value: code,
        label: <span lang={code}>{label}</span>,
      }))}
    />
  );
}
