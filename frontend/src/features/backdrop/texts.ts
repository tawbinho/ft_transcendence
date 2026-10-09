import type { Language } from '@/i18n';
import type { Backdrop } from './backdrops';

// This feature keeps its own texts, so deleting the folder leaves nothing behind in src/i18n.
// Record<Language, ...> makes TypeScript fail if a language or a background has no text.
interface Texts {
  label: string;
  names: Record<Backdrop, string>;
}

export const TEXTS: Record<Language, Texts> = {
  en: {
    label: 'Page background',
    names: { plain: 'Plain', glow: 'Soft glow', dots: 'Dots', grid: 'Fine grid', board: 'Game board' },
  },
  fr: {
    label: 'Arrière-plan de la page',
    names: { plain: 'Uni', glow: 'Halo doux', dots: 'Points', grid: 'Grille fine', board: 'Plateau de jeu' },
  },
  ar: {
    label: 'خلفية الصفحة',
    names: { plain: 'عادية', glow: 'توهج هادئ', dots: 'نقاط', grid: 'شبكة دقيقة', board: 'لوحة اللعبة' },
  },
};
