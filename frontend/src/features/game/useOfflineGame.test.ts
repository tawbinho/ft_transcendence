import { act, renderHook, waitFor } from '@testing-library/react';
import { DEFAULT_BOARD_SETTINGS } from './settings';
import { useOfflineGame, type Opponent } from './useOfflineGame';

const human: Opponent = { kind: 'human' };

describe('useOfflineGame', () => {
  it('alternates players and derives the board from the moves', () => {
    const { result } = renderHook(() => useOfflineGame(DEFAULT_BOARD_SETTINGS, human));

    act(() => result.current.play(3));
    act(() => result.current.play(3));

    expect(result.current.moves).toEqual([3, 3]);
    expect(result.current.game.board[3]!.slice(0, 2)).toEqual([1, 2]);
    expect(result.current.game.current).toBe(1);
  });

  it('ignores illegal moves', () => {
    const { result } = renderHook(() => useOfflineGame(DEFAULT_BOARD_SETTINGS, human));
    act(() => result.current.play(42));
    expect(result.current.moves).toEqual([]);
  });

  it('undoes one move at a time between two people, and restarts', () => {
    const { result } = renderHook(() => useOfflineGame(DEFAULT_BOARD_SETTINGS, human));
    act(() => result.current.play(0));
    act(() => result.current.play(1));

    act(() => result.current.undo());
    expect(result.current.moves).toEqual([0]);

    act(() => result.current.restart());
    expect(result.current.moves).toEqual([]);
    expect(result.current.canUndo).toBe(false);
  });

  it('lets the computer answer, and undoes back to the human turn', async () => {
    const opponent: Opponent = { kind: 'computer', difficulty: 'easy', computerSeat: 2 };
    const { result } = renderHook(() => useOfflineGame(DEFAULT_BOARD_SETTINGS, opponent));

    act(() => result.current.play(3));
    expect(result.current.computerThinking).toBe(true);

    // The computer's move is ignored if the human tries to play for it.
    act(() => result.current.play(0));
    expect(result.current.moves).toHaveLength(1);

    await waitFor(() => expect(result.current.moves).toHaveLength(2), { timeout: 3000 });
    expect(result.current.computerThinking).toBe(false);

    act(() => result.current.undo());
    expect(result.current.moves).toEqual([]);
  });

  it('lets the computer open when it plays first', async () => {
    const opponent: Opponent = { kind: 'computer', difficulty: 'medium', computerSeat: 1 };
    const { result } = renderHook(() => useOfflineGame(DEFAULT_BOARD_SETTINGS, opponent));

    expect(result.current.computerThinking).toBe(true);
    await waitFor(() => expect(result.current.moves).toHaveLength(1), { timeout: 3000 });
    // Its opening move alone cannot be taken back.
    expect(result.current.canUndo).toBe(false);
  });
});
