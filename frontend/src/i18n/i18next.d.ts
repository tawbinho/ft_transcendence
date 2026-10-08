import 'i18next';
import type { Messages } from './locales/en';

// Makes t() check translation keys at compile time.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: Messages };
  }
}
