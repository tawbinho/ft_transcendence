import type { GameState } from '../engine';
import { chooseMove, type Difficulty } from './bot';
import type { BotRequest, BotResponse } from './protocol';

export interface BotClient {
  /** Resolves with the computer's column for the player to move in `state`. */
  chooseMove(state: GameState, difficulty: Difficulty): Promise<number>;
  /** Stops the worker; pending requests reject. */
  dispose(): void;
}

interface Pending {
  request: BotRequest;
  resolve: (col: number) => void;
  reject: (reason: Error) => void;
}

/**
 * Asks a Web Worker for the computer's moves. Where workers are unavailable
 * (tests, very old browsers) or the worker fails to start, the same search
 * runs on the main thread instead.
 */
export function createBotClient(): BotClient {
  let worker: Worker | null = null;
  let workerFailed = typeof Worker === 'undefined';
  let nextId = 1;
  const pending = new Map<number, Pending>();

  const runHere = (request: BotRequest) => chooseMove(request.state, request.difficulty);

  function failOver() {
    workerFailed = true;
    worker?.terminate();
    worker = null;
    for (const { request, resolve } of pending.values()) resolve(runHere(request));
    pending.clear();
  }

  function getWorker(): Worker | null {
    if (worker || workerFailed) return worker;
    try {
      worker = new Worker(new URL('./bot.worker.ts', import.meta.url), { type: 'module' });
      worker.addEventListener('message', (event: MessageEvent<BotResponse>) => {
        const entry = pending.get(event.data.id);
        pending.delete(event.data.id);
        entry?.resolve(event.data.col);
      });
      worker.addEventListener('error', failOver);
    } catch {
      failOver();
    }
    return worker;
  }

  return {
    chooseMove(state, difficulty) {
      const request: BotRequest = { id: nextId++, state, difficulty };
      const target = getWorker();
      if (!target) {
        // Yield first so the caller's UI can show "thinking" before the search.
        return new Promise((resolve) => setTimeout(() => resolve(runHere(request)), 0));
      }
      return new Promise((resolve, reject) => {
        pending.set(request.id, { request, resolve, reject });
        target.postMessage(request);
      });
    },
    dispose() {
      worker?.terminate();
      worker = null;
      for (const { reject } of pending.values()) reject(new Error('The computer player was stopped'));
      pending.clear();
    },
  };
}
