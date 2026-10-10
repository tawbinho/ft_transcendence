import type { SVGProps } from 'react';
import { DISC_YELLOW, IllustrationSvg } from './IllustrationSvg';

/** "4 0 4" where the zero is a yellow disc: a page that does not exist. */
export function NotFoundIllustration(props: SVGProps<SVGSVGElement>) {
  const four = {
    stroke: 'var(--c-primary)',
    strokeWidth: 11,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  } as const;
  return (
    <IllustrationSvg viewBox="0 0 200 120" {...props}>
      <g {...four} transform="translate(5 0)">
        <path d="M38 20 6 74h54" />
        <path d="M38 20v82" />
        <path d="M162 20l-32 54h54" />
        <path d="M162 20v82" />
      </g>
      <circle cx="100" cy="64" r="27" fill={DISC_YELLOW} />
      <circle cx="100" cy="64" r="13" stroke="#000" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M84 52a22 22 0 0 1 12-8" stroke="#fff" strokeOpacity="0.7" strokeWidth="5" strokeLinecap="round" />
    </IllustrationSvg>
  );
}
