import { ACCENTS, applyAccent, getAccent, setAccent } from './accent';

afterEach(() => {
  delete document.documentElement.dataset.accent;
});

describe('accent color', () => {
  it('is blue until a member chooses another one', () => {
    expect(getAccent()).toBe('blue');
  });

  it('saves the choice, puts it on the page and remembers it', () => {
    setAccent('violet');

    expect(document.documentElement.dataset.accent).toBe('violet');
    expect(window.localStorage.getItem('accent')).toBe('violet');
    expect(getAccent()).toBe('violet');
  });

  it('removes the attribute and the saved value when going back to blue', () => {
    setAccent('teal');
    setAccent('blue');

    expect(document.documentElement.dataset.accent).toBeUndefined();
    expect(window.localStorage.getItem('accent')).toBeNull();
  });

  it('ignores a saved value that is not an accent', () => {
    window.localStorage.setItem('accent', 'hotpink');

    expect(getAccent()).toBe('blue');
    applyAccent();
    expect(document.documentElement.dataset.accent).toBeUndefined();
  });

  it('applies the saved accent when asked to, as the page does on start', () => {
    window.localStorage.setItem('accent', 'rose');
    applyAccent();
    expect(document.documentElement.dataset.accent).toBe('rose');
  });

  it('offers blue first, as the default', () => {
    expect(ACCENTS[0]).toBe('blue');
  });
});
