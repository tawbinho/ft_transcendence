import { loginHint } from './loginHint';

describe('loginHint', () => {
  it('names the section the visitor wanted', () => {
    expect(loginHint('/watch')).toEqual({ kind: 'section', section: 'nav.watch' });
    expect(loginHint('/players?search=bo')).toEqual({ kind: 'section', section: 'nav.players' });
    expect(loginHint('/chat/bob#last')).toEqual({ kind: 'section', section: 'nav.chat' });
  });

  it('asks to log in to continue for a page that is not a section', () => {
    expect(loginHint('/settings')).toEqual({ kind: 'generic' });
  });

  it('has no hint when the visitor came to the login page on their own', () => {
    expect(loginHint(null)).toBeNull();
  });
});
