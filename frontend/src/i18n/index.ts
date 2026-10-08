import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import { readStorage, writeStorage } from '@/lib/storage';
import { ar } from './locales/ar';
import { en } from './locales/en';
import { fr } from './locales/fr';

export const LANGUAGES = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'fr', label: 'Français', dir: 'ltr' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
] as const;

export type Language = (typeof LANGUAGES)[number]['code'];

export const resources = {
  en: { translation: en },
  fr: { translation: fr },
  ar: { translation: ar },
} as const;

const STORAGE_KEY = 'language';

export function isLanguage(value: unknown): value is Language {
  return LANGUAGES.some((language) => language.code === value);
}

/** The saved choice, else the browser's preferred languages, else English. */
function detectLanguage(): Language {
  const saved = readStorage(STORAGE_KEY);
  if (isLanguage(saved)) return saved;
  const preferred = typeof navigator === 'undefined' ? [] : (navigator.languages ?? [navigator.language]);
  for (const tag of preferred) {
    const base = tag?.toLowerCase().split('-')[0];
    if (isLanguage(base)) return base;
  }
  return 'en';
}

function applyToDocument(language: string) {
  const entry = LANGUAGES.find((candidate) => candidate.code === language) ?? LANGUAGES[0];
  document.documentElement.lang = entry.code;
  document.documentElement.dir = entry.dir;
}

void i18n.use(initReactI18next).init({
  resources,
  lng: detectLanguage(),
  fallbackLng: 'en',
  supportedLngs: LANGUAGES.map((language) => language.code),
  // Everything is bundled, so translations are ready synchronously.
  initAsync: false,
  // React already escapes rendered text.
  interpolation: { escapeValue: false },
});

applyToDocument(i18n.language);
i18n.on('languageChanged', (language) => {
  writeStorage(STORAGE_KEY, language);
  applyToDocument(language);
});

/** The current language and a setter that applies it everywhere. */
export function useLanguage(): [Language, (language: Language) => void] {
  const { i18n: instance } = useTranslation();
  const current = isLanguage(instance.resolvedLanguage) ? instance.resolvedLanguage : 'en';
  return [current, (language) => void instance.changeLanguage(language)];
}

export default i18n;
