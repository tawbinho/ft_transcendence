import { phonePane } from './panes';

describe('phonePane', () => {
  it('shows the list when no conversation is open', () => {
    expect(phonePane(undefined)).toBe('list');
    expect(phonePane('')).toBe('list');
  });

  it('shows the conversation once a player is picked', () => {
    expect(phonePane('bob')).toBe('conversation');
  });
});
