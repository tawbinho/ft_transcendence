import { applyBackdrop, getBackdrop, setBackdrop } from './backdrops';

afterEach(() => applyBackdrop('plain'));

describe('the saved page background', () => {
  it('is plain until a member chooses one', () => {
    expect(getBackdrop()).toBe('plain');
    expect(document.documentElement).not.toHaveAttribute('data-backdrop');
  });

  it('is saved on this device and put on the page', () => {
    setBackdrop('dots');
    expect(window.localStorage.getItem('backdrop')).toBe('dots');
    expect(getBackdrop()).toBe('dots');
    expect(document.documentElement).toHaveAttribute('data-backdrop', 'dots');
  });

  it('forgets everything when plain is chosen again', () => {
    setBackdrop('grid');
    setBackdrop('plain');
    expect(window.localStorage.getItem('backdrop')).toBeNull();
    expect(document.documentElement).not.toHaveAttribute('data-backdrop');
  });

  it('ignores a saved value it does not know', () => {
    window.localStorage.setItem('backdrop', 'fireworks');
    expect(getBackdrop()).toBe('plain');
  });

  it('puts the saved choice on the page when the app starts', () => {
    window.localStorage.setItem('backdrop', 'board');
    applyBackdrop();
    expect(document.documentElement).toHaveAttribute('data-backdrop', 'board');
  });
});
