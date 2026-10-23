import { useTranslation } from 'react-i18next';
import type { Tournament } from '@/features/tournaments/types';
import { PlayerLink } from '@/features/users/components/PlayerLink';

/** The registered players, with who is online. Each name links to the player's profile. */
export function PlayersPanel({ tournament }: { tournament: Tournament }) {
  const { t } = useTranslation();
  return (
    <section aria-labelledby="players-title" className="rounded-2xl border border-border bg-surface p-4">
      <h2 id="players-title" className="mb-3 font-bold">
        {t('tournaments.players')}{' '}
        <span className="font-normal text-muted">
          {tournament.players.length}/{tournament.size}
        </span>
      </h2>
      <ul className="flex flex-col gap-2">
        {tournament.players.map((player) => (
          <li key={player.id}>
            <PlayerLink user={player} presence />
          </li>
        ))}
      </ul>
    </section>
  );
}
