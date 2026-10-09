import { parentPort } from 'node:worker_threads';
import type { GameState } from '../engine/game.types.js';
import { chooseMove, type Difficulty } from './ai.js';

// WHY THIS FILE EXISTS
// Thinking takes up to a second on a hard level, and Node runs all the
// server's requests and live connections on ONE thread: if the AI thought
// there, every player would freeze for that second. This file runs on a
// separate WORKER thread instead: it receives a position, thinks, and answers
// with a column (see ai-thread.ts, which talks to it).
export interface AiRequest {
  id: number;
  state: GameState;
  difficulty: Difficulty;
}

export type AiResponse =
  | { id: number; col: number }
  | { id: number; error: string };

parentPort?.on('message', (request: AiRequest) => {
  try {
    const col = chooseMove(request.state, request.difficulty);
    parentPort?.postMessage({ id: request.id, col } satisfies AiResponse);
  } catch (error) {
    parentPort?.postMessage({
      id: request.id,
      error: String(error),
    } satisfies AiResponse);
  }
});
