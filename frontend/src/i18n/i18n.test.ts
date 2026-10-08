import { ar } from './locales/ar';
import { en } from './locales/en';
import { fr } from './locales/fr';

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
