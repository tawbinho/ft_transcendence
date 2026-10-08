import type { ReactNode } from 'react';
import { CrownIcon } from '@/components/icons';
import { Card } from '@/components/ui';

/** The winner of a tournament, with a crown. Used by both kinds of tournament. */
export function ChampionCard({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <Card className="flex flex-col items-center gap-3 text-center">
      <CrownIcon className="text-5xl text-warning" />
      <h2 className="text-2xl font-extrabold break-words">{title}</h2>
      {children}
    </Card>
  );
}
