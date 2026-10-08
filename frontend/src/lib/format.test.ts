import { formatMessageTime, formatRelative } from './format';

describe('formatRelative', () => {
  const now = Date.parse('2026-10-08T12:00:00Z');

  it('uses the largest unit that fits', () => {
    expect(formatRelative('2026-10-08T11:55:00Z', 'en', now)).toBe('5 minutes ago');
    expect(formatRelative('2026-10-08T09:00:00Z', 'en', now)).toBe('3 hours ago');
    expect(formatRelative('2026-10-07T12:00:00Z', 'en', now)).toBe('yesterday');
    expect(formatRelative('2026-09-17T12:00:00Z', 'en', now)).toBe('3 weeks ago');
  });

  it('says "this minute" for the last seconds, and nothing for a bad date', () => {
    expect(formatRelative('2026-10-08T11:59:40Z', 'en', now)).toBe('this minute');
    expect(formatRelative('not a date', 'en', now)).toBe('');
  });

  it('speaks the reader’s language', () => {
    expect(formatRelative('2026-10-08T09:00:00Z', 'fr', now)).toBe('il y a 3 heures');
  });
});

describe('formatMessageTime', () => {
  it('shows only the time for a message sent today', () => {
    const now = new Date(2026, 9, 8, 18, 0);
    expect(formatMessageTime(new Date(2026, 9, 8, 14, 5).toISOString(), 'en', now)).toMatch(/^2:05\sPM$/);
    expect(formatMessageTime(new Date(2026, 9, 6, 14, 5).toISOString(), 'en', now)).toMatch(/10\/6\/26/);
  });
});
