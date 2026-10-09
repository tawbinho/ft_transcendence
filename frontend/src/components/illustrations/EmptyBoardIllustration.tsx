import type { SVGProps } from 'react';
import { DISC_RED, DISC_YELLOW, IllustrationSvg } from './IllustrationSvg';

const COLUMNS = [0, 1, 2, 3, 4];
const ROWS = [0, 1, 2, 3];

/** A board with two discs in it and a third one about to drop: "nothing here yet, start a game". */
export function EmptyBoardIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <IllustrationSvg {...props}>
      <rect x="30" y="30" width="100" height="78" rx="12" fill="var(--c-primary)" />
      {ROWS.flatMap((row) =>
        COLUMNS.map((column) => (
          <circle key={`${column},${row}`} cx={44 + column * 18} cy={43 + row * 18} r="7" fill="var(--c-surface)" />
        )),
      )}
      <circle cx="80" cy="97" r="7" fill={DISC_RED} />
      <circle cx="98" cy="97" r="7" fill={DISC_YELLOW} />
      <circle cx="80" cy="79" r="7" fill={DISC_YELLOW} />
      {/* The disc that is about to drop, with its path. */}
      <path d="M116 6v10" stroke="var(--c-muted)" strokeWidth="2" strokeLinecap="round" strokeDasharray="1 5" />
      <circle cx="116" cy="22" r="7" fill={DISC_RED} />
      <rect x="38" y="104" width="10" height="10" rx="3" fill="var(--c-primary)" opacity="0.7" />
      <rect x="112" y="104" width="10" height="10" rx="3" fill="var(--c-primary)" opacity="0.7" />
    </IllustrationSvg>
  );
}
