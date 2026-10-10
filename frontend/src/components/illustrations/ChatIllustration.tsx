import type { SVGProps } from 'react';
import { IllustrationSvg } from './IllustrationSvg';

/** Two speech bubbles: messages, friends, conversations. */
export function ChatIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <IllustrationSvg {...props}>
      <path
        d="M30 22h70a10 10 0 0 1 10 10v26a10 10 0 0 1-10 10H62L44 84V68h-14a10 10 0 0 1-10-10V32a10 10 0 0 1 10-10z"
        fill="var(--c-primary)"
      />
      <path d="M36 40h44M36 52h28" stroke="var(--c-primary-fg)" strokeWidth="5" strokeLinecap="round" />
      <path
        d="M62 58h66a10 10 0 0 1 10 10v24a10 10 0 0 1-10 10h-8v14l-18-14H62a10 10 0 0 1-10-10V68a10 10 0 0 1 10-10z"
        transform="translate(0 -6)"
        fill="var(--c-surface-2)"
        stroke="var(--c-border)"
        strokeWidth="2"
      />
      <circle cx="78" cy="74" r="4" fill="var(--c-muted)" />
      <circle cx="94" cy="74" r="4" fill="var(--c-muted)" />
      <circle cx="110" cy="74" r="4" fill="var(--c-muted)" />
    </IllustrationSvg>
  );
}
