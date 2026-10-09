import type { SVGProps } from 'react';
import { DISC_YELLOW, IllustrationSvg } from './IllustrationSvg';

const GOLD_DARK = '#d99e0b';

/** A cup with sparkles: results, rankings, victories. */
export function TrophyIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <IllustrationSvg {...props}>
      <path d="M52 30H34a4 4 0 0 0-4 4c0 16 8 28 24 30" stroke={GOLD_DARK} strokeWidth="6" strokeLinecap="round" />
      <path d="M108 30h18a4 4 0 0 1 4 4c0 16-8 28-24 30" stroke={GOLD_DARK} strokeWidth="6" strokeLinecap="round" />
      <path d="M50 18h60v26c0 18-13 30-30 30S50 62 50 44z" fill={DISC_YELLOW} />
      <path d="M58 24v20c0 10 5 18 12 22" stroke="#fff" strokeOpacity="0.55" strokeWidth="5" strokeLinecap="round" />
      <rect x="74" y="74" width="12" height="16" fill={GOLD_DARK} />
      <rect x="58" y="90" width="44" height="12" rx="4" fill="var(--c-primary)" />
      <rect x="50" y="102" width="60" height="8" rx="4" fill="var(--c-surface-2)" stroke="var(--c-border)" />
      <path d="M142 18v14M135 25h14" stroke="var(--c-primary)" strokeWidth="3" strokeLinecap="round" />
      <path d="M18 70v10M13 75h10" stroke="var(--c-primary)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="132" cy="70" r="3" fill="var(--c-muted)" />
      <circle cx="26" cy="22" r="3" fill="var(--c-muted)" />
    </IllustrationSvg>
  );
}
