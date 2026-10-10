import { resolveSection } from './sections';

describe('resolveSection', () => {
  it('opens the profile section at plain /settings', () => {
    expect(resolveSection(undefined)).toEqual({ section: 'profile', canonical: true });
  });

  it('opens each other section at its own address', () => {
    expect(resolveSection('security')).toEqual({ section: 'security', canonical: true });
    expect(resolveSection('preferences')).toEqual({ section: 'preferences', canonical: true });
    expect(resolveSection('blocked')).toEqual({ section: 'blocked', canonical: true });
  });

  it('sends /settings/profile and unknown sections back to /settings', () => {
    expect(resolveSection('profile')).toEqual({ section: 'profile', canonical: false });
    expect(resolveSection('billing')).toEqual({ section: 'profile', canonical: false });
    expect(resolveSection('')).toEqual({ section: 'profile', canonical: false });
  });
});
