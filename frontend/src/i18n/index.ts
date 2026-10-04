import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './locales/en';
import { fr } from './locales/fr';
import { ar } from './locales/ar';

export const LANGUAGES = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'fr', label: 'Français', dir: 'ltr' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
] as const;

const STORAGE_KEY = 'cfa.lang';
const saved = localStorage.getItem(STORAGE_KEY) ?? 'en';

void i18n.use(initReactI18next).init({
  resources: { en, fr, ar },
  lng: saved,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

function applyDirection(lng: string): void {
  const language = LANGUAGES.find((l) => l.code === lng);
  document.documentElement.lang = lng;
  document.documentElement.dir = language?.dir ?? 'ltr';
}

applyDirection(saved);
i18n.on('languageChanged', (lng) => {
  localStorage.setItem(STORAGE_KEY, lng);
  applyDirection(lng);
});

export default i18n;
