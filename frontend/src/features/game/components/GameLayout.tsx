import type { ReactNode } from 'react';

/** The shape of every game screen: the board column on one side, a narrow side panel on the other. */
export function GameLayout({ children, aside }: { children: ReactNode; aside: ReactNode }) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="flex flex-col gap-4">{children}</div>
      <aside className="flex flex-col gap-4">{aside}</aside>
    </div>
  );
}
