import { useState } from 'react';
import { useLocalTournament } from '@/features/tournaments/useLocalTournament';
import type { PairingRef } from '@/features/tournaments/view';
import { LocalMatch } from './local/LocalMatch';
import { LocalOverview } from './local/LocalOverview';
import { LocalSetup } from './local/LocalSetup';
import { ResumePrompt } from './local/ResumePrompt';

/** A knockout tournament for 3 to 8 people sharing this screen. */
export function LocalTournamentPage() {
  const local = useLocalTournament();
  const [playing, setPlaying] = useState<PairingRef | null>(null);
  const { tournament } = local;

  if (!tournament) return <LocalSetup onStart={local.start} />;

  if (local.undecided) {
    return <ResumePrompt tournament={tournament} onResume={local.resume} onStartNew={local.clear} />;
  }

  if (playing) {
    return (
      <LocalMatch
        // A new key gives each match a fresh game.
        key={`${playing.round}:${playing.index}`}
        tournament={tournament}
        pairing={playing}
        onWinner={(slot) => {
          local.recordWinner(playing.round, playing.index, slot);
          setPlaying(null);
        }}
        onLeave={() => setPlaying(null)}
      />
    );
  }

  return (
    <LocalOverview tournament={tournament} onPlay={setPlaying} onPlayAgain={local.startAgain} onClear={local.clear} />
  );
}
