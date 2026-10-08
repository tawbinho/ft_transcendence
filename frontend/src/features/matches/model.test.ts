import { makeMatch } from '@/test/factories';
import { canPlayColumn, isMyTurn, opponentOf, outcomeOf, pollInterval, withMove } from './model';

describe('match model', () => {
  it('knows whose turn it is', () => {
    expect(isMyTurn(makeMatch())).toBe(true);
    expect(isMyTurn(makeMatch({}, [3]))).toBe(false);
    expect(isMyTurn(makeMatch({ status: 'waiting' }))).toBe(false);
    expect(opponentOf(makeMatch())?.displayName).toBe('bob');
  });

  it('reads the outcome from the viewer’s side', () => {
    expect(outcomeOf(makeMatch())).toBeNull();
    expect(outcomeOf(makeMatch({ status: 'finished', winnerSeat: 1 }))).toBe('won');
    expect(outcomeOf(makeMatch({ status: 'finished', winnerSeat: 2 }))).toBe('lost');
    expect(outcomeOf(makeMatch({ status: 'finished', winnerSeat: null }))).toBe('draw');
    expect(outcomeOf(makeMatch({ status: 'abandoned', winnerSeat: null }))).toBe('cancelled');
  });

  it('applies a move locally for an instant answer', () => {
    const match = makeMatch();
    const next = withMove(match, 3)!;
    expect(next.game.board[3]![0]).toBe(1);
    expect(next.game.moves).toEqual([3]);
    expect(next.game.lastMove).toEqual({ col: 3, row: 0 });
    expect(next.game.current).toBe(2);
    expect(match.game.moves).toEqual([]); // the original is untouched
  });

  it('blocks moves that cannot be played', () => {
    expect(withMove(makeMatch({}, [3]), 2)).toBeNull(); // not my turn
    const full = makeMatch({}, [0, 0, 0, 0, 0, 0]);
    expect(canPlayColumn(full, 0)).toBe(false);
    expect(withMove(full, 0)).toBeNull();
    expect(withMove(makeMatch(), 9)).toBeNull();
  });

  it('stops play locally once the move wins', () => {
    const match = makeMatch({}, [0, 1, 0, 1, 0, 1]);
    const next = withMove(match, 0)!;
    expect(next.game.winningLine).toHaveLength(4);
    expect(next.game.current).toBeNull();
  });

  it('polls faster while waiting for the opponent', () => {
    expect(pollInterval(undefined)).toBe(false);
    expect(pollInterval(makeMatch({ status: 'finished' }))).toBe(false);
    expect(pollInterval(makeMatch({ status: 'waiting' }))).toBe(2000);
    expect(pollInterval(makeMatch({}, [3]))).toBe(2000);
    expect(pollInterval(makeMatch())).toBe(5000);
  });
});
