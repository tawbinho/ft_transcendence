import { paths } from './paths';

describe('paths', () => {
  it('links to the settings page, and to one of its sections', () => {
    expect(paths.settings()).toBe('/settings');
    expect(paths.settings('security')).toBe('/settings/security');
  });

  it('writes names and ids safely into the address', () => {
    expect(paths.profile('a b/c')).toBe('/users/a%20b%2Fc');
    expect(paths.chat()).toBe('/chat');
    expect(paths.chat('bob')).toBe('/chat/bob');
    expect(paths.match('m 1')).toBe('/matches/m%201');
    expect(paths.challenge('bob')).toBe('/play/online?opponent=bob');
  });
});
