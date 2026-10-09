import { act, renderHook } from '@testing-library/react';
import { REPLAY_STEP_MS, useReplay } from './useReplay';

describe('useReplay', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('opens on the last position', () => {
    const { result } = renderHook(() => useReplay(7));
    expect(result.current.step).toBe(7);
    expect(result.current.playing).toBe(false);
  });

  it('goes to a position and stays inside the match', () => {
    const { result } = renderHook(() => useReplay(7));
    act(() => result.current.goTo(3));
    expect(result.current.step).toBe(3);
    act(() => result.current.goTo(99));
    expect(result.current.step).toBe(7);
    act(() => result.current.goTo(-5));
    expect(result.current.step).toBe(0);
  });

  it('starts over when played from the end, one move at a time', () => {
    const { result } = renderHook(() => useReplay(3));
    act(() => result.current.togglePlay());
    expect(result.current.step).toBe(0);
    expect(result.current.playing).toBe(true);

    act(() => vi.advanceTimersByTime(REPLAY_STEP_MS));
    expect(result.current.step).toBe(1);
    act(() => vi.advanceTimersByTime(REPLAY_STEP_MS * 2));
    expect(result.current.step).toBe(3);
    expect(result.current.playing).toBe(false);
  });

  it('pauses', () => {
    const { result } = renderHook(() => useReplay(5));
    act(() => result.current.goTo(1));
    act(() => result.current.togglePlay());
    act(() => vi.advanceTimersByTime(REPLAY_STEP_MS));
    act(() => result.current.togglePlay());
    act(() => vi.advanceTimersByTime(REPLAY_STEP_MS * 3));
    expect(result.current.step).toBe(2);
  });

  it('stops playing when the viewer picks a position', () => {
    const { result } = renderHook(() => useReplay(5));
    act(() => result.current.goTo(0));
    act(() => result.current.togglePlay());
    act(() => result.current.goTo(2));
    expect(result.current.playing).toBe(false);
    act(() => vi.advanceTimersByTime(REPLAY_STEP_MS * 3));
    expect(result.current.step).toBe(2);
  });
});
