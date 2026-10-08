import { act, renderHook } from '@testing-library/react';
import { DEFAULT_BOARD_SETTINGS } from '@/features/game/settings';
import { championOf, nextPairing } from './bracket';
import { createLocalTournament, loadLocalTournament, saveLocalTournament } from './local';
import { useLocalTournament } from './useLocalTournament';

const NAMES = ['Ana', 'Ben', 'Cleo', 'Dan'];

/** A tournament in which the first player of every pairing wins, until there is a champion. */
function finishedTournament() {
  let tournament = createLocalTournament(NAMES, DEFAULT_BOARD_SETTINGS, () => 0);
  for (let next = nextPairing(tournament.bracket); next; next = nextPairing(tournament.bracket)) {
    const { round, index } = next;
    tournament = {
      ...tournament,
      bracket: tournament.bracket.map((pairings, r) =>
        pairings.map((pairing, i) => (r === round && i === index ? { ...pairing, winner: 0 as const } : pairing)),
      ),
    };
    // Carry the winner to the next round the way recordWinner does.
    const winner = tournament.bracket[round]![index]!.players[0];
    const later = tournament.bracket[round + 1]?.[Math.floor(index / 2)];
    if (later) later.players[index % 2] = winner;
  }
  return tournament;
}

describe('useLocalTournament', () => {
  it('starts with nothing when nothing is saved', () => {
    const { result } = renderHook(() => useLocalTournament());
    expect(result.current.tournament).toBeNull();
    expect(result.current.undecided).toBe(false);
  });

  it('draws and saves a tournament when it starts', () => {
    const { result } = renderHook(() => useLocalTournament());
    act(() => result.current.start(NAMES, DEFAULT_BOARD_SETTINGS));

    expect(result.current.tournament?.players).toEqual(NAMES);
    expect(loadLocalTournament()?.players).toEqual(NAMES);
    expect(result.current.undecided).toBe(false);
  });

  it('records a winner and keeps it saved', () => {
    const { result } = renderHook(() => useLocalTournament());
    act(() => result.current.start(NAMES, DEFAULT_BOARD_SETTINGS));
    const first = nextPairing(result.current.tournament!.bracket)!;
    act(() => result.current.recordWinner(first.round, first.index, 0));

    expect(result.current.tournament!.bracket[first.round]![first.index]!.winner).toBe(0);
    expect(loadLocalTournament()!.bracket[first.round]![first.index]!.winner).toBe(0);
  });

  it('asks what to do with a saved tournament that is not finished', () => {
    saveLocalTournament(createLocalTournament(NAMES, DEFAULT_BOARD_SETTINGS));
    const { result } = renderHook(() => useLocalTournament());

    expect(result.current.tournament?.players).toEqual(NAMES);
    expect(result.current.undecided).toBe(true);
    act(() => result.current.resume());
    expect(result.current.undecided).toBe(false);
    expect(result.current.tournament).not.toBeNull();
  });

  it('forgets the saved tournament when the player starts a new one', () => {
    saveLocalTournament(createLocalTournament(NAMES, DEFAULT_BOARD_SETTINGS));
    const { result } = renderHook(() => useLocalTournament());
    act(() => result.current.clear());

    expect(result.current.tournament).toBeNull();
    expect(result.current.undecided).toBe(false);
    expect(loadLocalTournament()).toBeNull();
  });

  it('shows a finished tournament without asking', () => {
    const finished = finishedTournament();
    expect(championOf(finished.bracket)).not.toBeNull();
    saveLocalTournament(finished);
    const { result } = renderHook(() => useLocalTournament());

    expect(result.current.undecided).toBe(false);
    expect(result.current.tournament).not.toBeNull();
  });

  it('draws the same players again with the same board', () => {
    saveLocalTournament(finishedTournament());
    const { result } = renderHook(() => useLocalTournament());
    act(() => result.current.startAgain());

    expect(result.current.tournament?.players).toEqual(NAMES);
    expect(championOf(result.current.tournament!.bracket)).toBeNull();
  });

  it('ignores a saved value that is not a tournament', () => {
    window.localStorage.setItem('local-tournament', '{"version":1,"players":"nope"}');
    const { result } = renderHook(() => useLocalTournament());
    expect(result.current.tournament).toBeNull();
  });
});
