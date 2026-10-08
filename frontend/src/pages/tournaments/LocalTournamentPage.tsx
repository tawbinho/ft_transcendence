import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { CloseIcon, CrownIcon, PlayIcon, PlusIcon, RefreshIcon } from '@/components/icons';
import { PageHeader } from '@/components/PageHeader';
import { Alert, Button, buttonClass, Card, ConfirmDialog, TextField } from '@/components/ui';
import { Board } from '@/features/game/components/Board';
import { BoardSettingsFields } from '@/features/game/components/BoardSettingsFields';
import { GameSummary } from '@/features/game/components/GameSummary';
import { PlayerTag } from '@/features/game/components/PlayerTag';
import type { Seat } from '@/features/game/engine';
import { DEFAULT_BOARD_SETTINGS, type BoardSettings } from '@/features/game/settings';
import { useOfflineGame } from '@/features/game/useOfflineGame';
import { championOf, nextPairing, type Slot } from '@/features/tournaments/bracket';
import { BracketView, type BracketPairingView } from '@/features/tournaments/components/BracketView';
import {
  ALIAS_MAX,
  createLocalTournament,
  loadLocalTournament,
  LOCAL_MAX_PLAYERS,
  LOCAL_MIN_PLAYERS,
  recordLocalResult,
  saveLocalTournament,
  validateAliases,
  type LocalTournament,
} from '@/features/tournaments/local';
import { cn } from '@/lib/cn';

interface Pairing {
  round: number;
  index: number;
}

/** A knockout tournament for 3 to 8 people sharing this screen. */
export function LocalTournamentPage() {
  const [tournament, setTournament] = useState<LocalTournament | null>(loadLocalTournament);
  const [playing, setPlaying] = useState<Pairing | null>(null);

  function update(next: LocalTournament | null) {
    saveLocalTournament(next);
    setTournament(next);
  }

  if (!tournament) return <SetupForm onStart={update} />;

  if (playing) {
    return (
      <TournamentMatch
        // A new key gives each match a fresh game.
        key={`${playing.round}:${playing.index}`}
        tournament={tournament}
        pairing={playing}
        onWinner={(slot) => {
          update(recordLocalResult(tournament, playing.round, playing.index, slot));
          setPlaying(null);
        }}
        onLeave={() => setPlaying(null)}
      />
    );
  }

  return <Overview tournament={tournament} onPlay={setPlaying} onEnd={() => update(null)} />;
}

// ---- Registration -------------------------------------------------------------

function SetupForm({ onStart }: { onStart: (tournament: LocalTournament) => void }) {
  const { t } = useTranslation();
  const [names, setNames] = useState<string[]>(['', '', '', '']);
  const [settings, setSettings] = useState<BoardSettings>(DEFAULT_BOARD_SETTINGS);
  const [submitted, setSubmitted] = useState(false);
  const errors = validateAliases(names);

  function setName(index: number, value: string) {
    setNames(names.map((name, i) => (i === index ? value : name)));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (errors.some(Boolean)) return;
    onStart(createLocalTournament(names, settings));
  }

  return (
    <>
      <PageHeader title={t('localTournament.title')} subtitle={t('localTournament.subtitle')} />
      <Card className="mx-auto max-w-3xl">
        <form onSubmit={submit} noValidate className="flex flex-col gap-7">
          <fieldset className="flex flex-col gap-4">
            <legend className="mb-1 text-lg font-bold">{t('localTournament.players')}</legend>
            <p className="text-sm text-muted">
              {t('localTournament.playersHint', { min: LOCAL_MIN_PLAYERS, max: LOCAL_MAX_PLAYERS })}
            </p>
            <ol className="grid gap-3 sm:grid-cols-2">
              {names.map((name, index) => (
                <li key={index} className="flex items-start gap-2">
                  <TextField
                    className="flex-1"
                    label={t('offline.playerName', { n: index + 1 })}
                    value={name}
                    maxLength={ALIAS_MAX}
                    autoComplete="off"
                    onChange={(event) => setName(index, event.target.value)}
                    error={submitted && errors[index] ? t(errors[index]) : null}
                  />
                  {names.length > LOCAL_MIN_PLAYERS && (
                    <Button
                      variant="ghost"
                      className="mt-7 size-11 flex-none p-0"
                      onClick={() => setNames(names.filter((_, i) => i !== index))}
                    >
                      <CloseIcon />
                      <span className="sr-only">{t('localTournament.removePlayer', { n: index + 1 })}</span>
                    </Button>
                  )}
                </li>
              ))}
            </ol>
            {names.length < LOCAL_MAX_PLAYERS && (
              <Button variant="secondary" className="self-start" onClick={() => setNames([...names, ''])}>
                <PlusIcon />
                {t('localTournament.addPlayer')}
              </Button>
            )}
          </fieldset>
          <BoardSettingsFields value={settings} onChange={setSettings} />
          <Button type="submit" size="lg" className="self-start">
            {t('localTournament.start')}
          </Button>
        </form>
      </Card>
    </>
  );
}

// ---- Bracket ------------------------------------------------------------------

function Overview({
  tournament,
  onPlay,
  onEnd,
}: {
  tournament: LocalTournament;
  onPlay: (pairing: Pairing) => void;
  onEnd: () => void;
}) {
  const { t } = useTranslation();
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const next = nextPairing(tournament.bracket);
  const champion = championOf(tournament.bracket);
  const nextPlayers = next ? tournament.bracket[next.round]![next.index]!.players : null;

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
          <Card className="flex flex-col items-center gap-3 text-center">
            <CrownIcon className="text-5xl text-warning" />
            <h2 className="text-2xl font-extrabold">{t('localTournament.champion', { name: champion })}</h2>
            <Button onClick={onEnd}>{t('localTournament.newTournament')}</Button>
          </Card>
        ) : (
          next &&
          nextPlayers && (
            <Card className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-muted">{t('localTournament.nextMatch')}</h2>
                <p className="text-2xl font-extrabold">
                  {nextPlayers[0]} <span className="text-muted">{t('online.vs')}</span> {nextPlayers[1]}
                </p>
              </div>
              <Button size="lg" onClick={() => onPlay(next)}>
                <PlayIcon />
                {t('localTournament.playMatch')}
              </Button>
            </Card>
          )
        )}

        <section aria-labelledby="bracket-title" className="flex flex-col gap-4">
          <h2 id="bracket-title" className="text-xl font-bold">
            {t('tournaments.bracket')}
          </h2>
          <BracketView rounds={rounds} label={t('tournaments.bracket')} />
        </section>

        <GameSummary settings={tournament.settings} />
      </div>

      <ConfirmDialog
        open={confirmingEnd}
        title={champion ? t('localTournament.newTournament') : t('localTournament.abandonTitle')}
        confirmLabel={champion ? t('localTournament.newTournament') : t('localTournament.abandon')}
        confirmVariant={champion ? 'primary' : 'danger'}
        onClose={() => setConfirmingEnd(false)}
        onConfirm={onEnd}
      >
        {champion ? t('localTournament.newTournamentBody') : t('localTournament.abandonBody')}
      </ConfirmDialog>
    </>
  );
}

// ---- One match ----------------------------------------------------------------

function TournamentMatch({
  tournament,
  pairing,
  onWinner,
  onLeave,
}: {
  tournament: LocalTournament;
  pairing: Pairing;
  onWinner: (slot: Slot) => void;
  onLeave: () => void;
}) {
  const { t } = useTranslation();
  const { settings } = tournament;
  const players = tournament.bracket[pairing.round]![pairing.index]!.players;
  const { game, moves, play, restart } = useOfflineGame(settings, { kind: 'human' });

  // The first player of the pairing takes seat 1 and starts.
  const nameOf = (seat: Seat) => players[seat - 1] ?? '?';
  const over = game.status !== 'playing';
  const status =
    game.status === 'won' && game.winner !== null
      ? t('game.wins', { name: nameOf(game.winner) })
      : game.status === 'draw'
        ? t('localTournament.drawReplay')
        : t('game.turnOf', { name: nameOf(game.current) });

  const lastSeat: Seat = moves.length % 2 === 1 ? 1 : 2;
  const announcement = game.lastMove
    ? [t('game.playedColumn', { name: nameOf(lastSeat), n: game.lastMove.col + 1 }), over && status]
        .filter(Boolean)
        .join(' ')
    : '';

  return (
    <>
      <PageHeader
        title={`${nameOf(1)} ${t('online.vs')} ${nameOf(2)}`}
        subtitle={t('localTournament.title')}
        actions={
          !over && (
            <Button variant="secondary" onClick={onLeave}>
              {t('localTournament.backToBracket')}
            </Button>
          )
        }
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            {([1, 2] as const).map((seat) => (
              <PlayerTag
                key={seat}
                seat={seat}
                theme={settings.theme}
                name={nameOf(seat)}
                note={t(`themes.${settings.theme}.seat${seat}`)}
                active={!over && game.current === seat}
                align={seat === 2 ? 'end' : 'start'}
              />
            ))}
          </div>
          <p
            className={cn(
              'rounded-xl px-4 py-2 text-center text-lg font-bold',
              game.status === 'won' && 'bg-success-soft text-success',
              game.status === 'draw' && 'bg-warning-soft',
            )}
          >
            {status}
          </p>
          {over && (
            <div className="flex flex-wrap justify-center gap-2">
              {game.status === 'won' && game.winner !== null ? (
                <Button size="lg" onClick={() => onWinner(game.winner === 1 ? 0 : 1)}>
                  {t('localTournament.continue')}
                </Button>
              ) : (
                <Button size="lg" onClick={restart}>
                  <RefreshIcon />
                  {t('localTournament.replay')}
                </Button>
              )}
            </div>
          )}
          <Board
            theme={settings.theme}
            model={{ ...settings, board: game.board, lastMove: game.lastMove, winningLine: game.winningLine }}
            onPlay={play}
            disabled={over}
            previewSeat={over ? null : game.current}
          />
        </div>
        <aside className="flex flex-col gap-4">
          <Alert tone="info">{t('localTournament.matchHint')}</Alert>
          <GameSummary settings={settings} moveCount={game.moveCount} />
          <Link to="/tournaments" className={buttonClass({ variant: 'ghost' })}>
            {t('tournaments.title')}
          </Link>
        </aside>
      </div>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </>
  );
}
