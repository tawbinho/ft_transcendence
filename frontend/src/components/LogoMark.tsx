import type { SVGProps } from 'react';

// The mark is a small board where four yellow discs connect along a diagonal:
// the whole point of the game. The same drawing is public/favicon.svg.
const CENTERS = [6.5, 12.83, 19.17, 25.5];
const RED_DISCS = new Set(['1,3', '2,3', '3,3', '2,2']);

/** The app's mark. Decorative: put the app name next to it. */
export function LogoMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" width="1em" height="1em" aria-hidden="true" focusable="false" {...props}>
      <rect width="32" height="32" rx="8" fill="#2b4fd8" />
      <rect width="32" height="32" rx="8" fill="none" stroke="#fff" strokeOpacity="0.18" />
      {CENTERS.flatMap((y, row) =>
        CENTERS.map((x, column) => {
          const onLine = row + column === 3;
          const fill = onLine ? '#f9c623' : RED_DISCS.has(`${column},${row}`) ? '#e5383b' : '#12297a';
          return <circle key={`${column},${row}`} cx={x} cy={y} r={onLine ? 2.9 : 2.6} fill={fill} />;
        }),
      )}
      <path d="M6.5 25.5 25.5 6.5" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.85" />
    </svg>
  );
}
