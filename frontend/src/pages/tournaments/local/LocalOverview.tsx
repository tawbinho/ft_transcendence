import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PlayIcon, RefreshIcon } from '@/components/icons';
import { PageHeader } from '@/components/PageHeader';
import { Button, Card, ConfirmDialog, ProgressBar } from '@/components/ui';
import { GameSummary } from '@/features/game/components/GameSummary';
import { championOf, nextPairing } from '@/features/tournaments/bracket';
import { BracketView, type BracketPairingView } from '@/features/tournaments/components/BracketView';
import { ChampionCard } from '@/features/tournaments/components/ChampionCard';
import type { LocalTournament } from '@/features/tournaments/local';
import { countMatches, type PairingRef } from '@/features/tournaments/view';

/** The bracket between matches: who plays next, how far along it is, and the way out. */
export function LocalOverview({
  tournament,
  onPlay,
  onPlayAgain,
  onClear,
}: {
  tournament: LocalTournament;
  onPlay: (pairing: PairingRef) => void;
  /** Draws the same players again. */
  onPlayAgain: () => void;
  /** Forgets the tournament and goes back to the setup form. */
  onClear: () => void;
}) {
  const { t } = useTranslation();
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const next = nextPairing(tournament.bracket);
  const champion = championOf(tournament.bracket);
  const nextPlayers = next ? tournament.bracket[next.round]![next.index]!.players : null;
  const { played, total } = countMatches(tournament.bracket);
  const progress = t('localTournament.progress', { played, total });

  const rounds: BracketPairingView[][] = tournament.bracket.map((pairings, round) =>
    pairings.map((pairing, index) => ({
      key: `${round}:${index}`,
      players: [
        pairing.players[0] === null ? null : { name: pairing.players[0] },
        pairing.players[1] === null ? null : { name: pairing.players[1] },
      ],
      winner: pairing.winner,
      bye: pairing.bye,
      current: next?.round === round && next.index === index,
    })),
  );

  return (
    <>
      <PageHeader
        title={t('localTournament.title')}
        actions={
          <Button variant="secondary" onClick={() => setConfirmingEnd(true)}>
            {champion ? t('localTournament.newTournament') : t('localTournament.abandon')}
          </Button>
        }
      />

      <div className="flex flex-col gap-8">
        {champion ? (
          <ChampionCard title={t('localTournament.champion', { name: champion })}>
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={onPlayAgain}>
                <RefreshIcon />
                {t('localTournament.playAgain')}
              </Button>
              <Button variant="secondary" onClick={onClear}>
                {t('localTournament.newTournament')}
              </Button>
            </div>
          </ChampionCard>
        ) : (
          next &&
          nextPlayers && (
            <Card className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-muted">{t('localTournament.nextMatch')}</h2>
                <p className="text-2xl font-extrabold break-words">
                  {nextPlayers[0]} <span className="text-muted">{t('localTournament.vs')}</span> {nextPlayers[1]}
                </p>
              </div>
              <Button size="lg" onClick={() => onPlay(next)}>
                <PlayIcon />
                {t('localTournament.playMatch')}
              </Button>
            </Card>
          )
        )}

        <section aria-labelledby="bracket-title" className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
            <h2 id="bracket-title" className="text-xl font-bold">
              {t('tournaments.bracket')}
            </h2>
            <div className="flex w-full max-w-xs flex-col gap-1">
              <p className="text-sm text-muted">{progress}</p>
              <ProgressBar value={played} max={total} label={progress} />
            </div>
          </div>
          <BracketView
            rounds={rounds}
            label={t('tournaments.bracket')}
            currentLabel={t('localTournament.nextMatch')}
            champion={champion}
          />
        </section>

        <GameSummary settings={tournament.settings} />
      </div>

      <ConfirmDialog
        open={confirmingEnd}
        title={champion ? t('localTournament.newTournament') : t('localTournament.abandonTitle')}
        confirmLabel={champion ? t('localTournament.newTournament') : t('localTournament.abandon')}
        confirmVariant={champion ? 'primary' : 'danger'}
        onClose={() => setConfirmingEnd(false)}
        onConfirm={onClear}
      >
        {champion ? t('localTournament.newTournamentBody') : t('localTournament.abandonBody')}
      </ConfirmDialog>
    </>
  );
}
