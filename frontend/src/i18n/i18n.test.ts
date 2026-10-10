import i18n from './index';
import { ar } from './locales/ar';
import { en } from './locales/en';
import { fr } from './locales/fr';

// Every translation file of a language (common.ts, play.ts, ...), without its index.ts.
function areaFiles(language: 'en' | 'fr' | 'ar') {
  const modules = {
    en: import.meta.glob<Record<string, object>>(['./locales/en/*.ts', '!./locales/en/index.ts'], { eager: true }),
    fr: import.meta.glob<Record<string, object>>(['./locales/fr/*.ts', '!./locales/fr/index.ts'], { eager: true }),
    ar: import.meta.glob<Record<string, object>>(['./locales/ar/*.ts', '!./locales/ar/index.ts'], { eager: true }),
  }[language];
  return Object.entries(modules).map(([file, exports]) => ({
    file,
    sections: Object.keys(Object.values(exports)[0] ?? {}),
  }));
}

type Tree = { [key: string]: string | Tree };

function leaves(tree: Tree, prefix = ''): Map<string, string> {
  const result = new Map<string, string>();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') result.set(path, value);
    else for (const [childPath, childValue] of leaves(value, path)) result.set(childPath, childValue);
  }
  return result;
}

const placeholders = (text: string) => [...text.matchAll(/{{\s*(\w+)\s*}}/g)].map((match) => match[1]).sort();

describe.each([
  ['fr', fr],
  ['ar', ar],
])('%s translations', (_language, messages) => {
  const reference = leaves(en);
  const translated = leaves(messages);

  it('fills every string', () => {
    for (const [path, text] of translated) {
      expect(text.trim(), path).not.toBe('');
    }
    expect([...translated.keys()].sort()).toEqual([...reference.keys()].sort());
  });

  it('keeps the same placeholders as English', () => {
    for (const [path, text] of reference) {
      expect(placeholders(translated.get(path) ?? ''), path).toEqual(placeholders(text));
    }
  });
});

describe.each(['en', 'fr', 'ar'] as const)('%s area files', (language) => {
  it('keeps each section in exactly one file', () => {
    const owners = new Map<string, string[]>();
    for (const { file, sections } of areaFiles(language)) {
      for (const section of sections) owners.set(section, [...(owners.get(section) ?? []), file]);
    }
    for (const [section, files] of owners) expect(files, `section "${section}"`).toHaveLength(1);
  });

  it('adds up to the whole language', () => {
    const sections = areaFiles(language).flatMap((area) => area.sections);
    const whole = { en, fr, ar }[language];
    expect(sections.sort()).toEqual(Object.keys(whole).sort());
  });

  it('has the same files as English', () => {
    const files = (lang: 'en' | 'fr' | 'ar') => areaFiles(lang).map((area) => area.file.split('/').pop());
    expect(files(language)).toEqual(files('en'));
  });
});

describe('i18next', () => {
  it('does not print its support notice in the console', () => {
    expect(i18n.options.showSupportNotice).toBe(false);
  });
});
