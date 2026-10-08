/** A date and time in the reader's language, e.g. "8 Oct 2026, 14:05". */
export function formatDateTime(iso: string, language: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function formatPercent(ratio: number, language: string): string {
  return new Intl.NumberFormat(language, { style: 'percent', maximumFractionDigits: 0 }).format(ratio);
}

/** A day in the reader's language, e.g. "8 Oct 2026". */
export function formatDate(iso: string, language: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(language, { dateStyle: 'medium' }).format(date);
}

/** Chat timestamps: only the time for today, the day and time before. */
export function formatMessageTime(iso: string, language: string, now = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const today = date.toDateString() === now.toDateString();
  return new Intl.DateTimeFormat(
    language,
    today ? { timeStyle: 'short' } : { dateStyle: 'short', timeStyle: 'short' },
  ).format(date);
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

/** "5 minutes ago", "yesterday", "3 weeks ago"... in the reader's language. */
export function formatRelative(iso: string, language: string, now = Date.now()): string {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return '';
  const seconds = (time - now) / 1000;
  const format = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit);
  }
  return format.format(0, 'minute');
}
