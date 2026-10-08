import type { Messages } from '@/i18n/locales/en';

/**
 * A translation key under "validation", for example "validation.required".
 * Validators return one of these (or null when the value is fine), and forms
 * show it with t().
 */
export type ValidationKey = `validation.${keyof Messages['validation'] & string}`;
