import { useCallback, useEffect, useRef, useState } from 'react';
import { canDrop, createGame, drop } from '@cf/engine';
import type { GameSettings, GameState } from '@cf/engine';
import { chooseMove, type Difficulty } from '@cf/ai';

/**
 * A game that runs entirely in the browser — used for local hot-seat play and
 * for playing the AI. The human is player 1; when `ai` is set, player 2 is the
 * computer and moves on its own turn.
 */
export function useLocalGame(settings: Partial<GameSettings>, ai: Difficulty | null) {
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const aiRef = useRef(ai);
  aiRef.current = ai;

  const [game, setGame] = useState<GameState>(() => createGame(settings));

  const play = useCallback((col: number) => {
    setGame((prev) => {
      if (prev.status !== 'playing' || !canDrop(prev, col)) return prev;
      if (aiRef.current && prev.current !== 1) return prev; // vs AI, only the human (seat 1) clicks
      return drop(prev, col);
    });
  }, []);

  const reset = useCallback(() => {
    setGame(createGame(settingsRef.current));
  }, []);

  // When it becomes the AI's turn, let it think briefly, then move.
  useEffect(() => {
    const difficulty = aiRef.current;
    if (!difficulty || game.status !== 'playing' || game.current !== 2) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      setGame((cur) => {
        if (cur.status !== 'playing' || cur.current !== 2) return cur;
        return drop(cur, chooseMove(cur, difficulty));
      });
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [game]);

  return { game, play, reset };
}
