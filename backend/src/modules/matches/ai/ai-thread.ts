import { Worker } from 'node:worker_threads';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import type { GameState } from '../engine/game.types.js';
import type { AiRequest, AiResponse } from './ai.worker.js';
import { chooseMove, type Difficulty } from './ai.js';

interface Pending {
  resolve: (col: number) => void;
  reject: (error: Error) => void;
}

// WHY THIS FILE EXISTS
// The server's side of the AI worker (ai.worker.ts): `choose(state, level)`
// sends the position to the worker thread and gives back a promise of the
// column. The worker starts on the first request and is restarted if it ever
// crashes. If a worker cannot be started at all, the AI thinks on the main
// thread instead, which still works, only it blocks the server while thinking.
@Injectable()
export class AiThread implements OnModuleDestroy {
  private readonly logger = new Logger(AiThread.name);
  private worker: Worker | undefined;
  private readonly pending = new Map<number, Pending>();
  private nextId = 1;

  choose(state: GameState, difficulty: Difficulty): Promise<number> {
    const worker = this.start();
    if (!worker) return Promise.resolve(chooseMove(state, difficulty));

    return new Promise<number>((resolve, reject) => {
      const id = this.nextId++;
      this.pending.set(id, { resolve, reject });
      worker.postMessage({ id, state, difficulty } satisfies AiRequest);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.terminate();
    this.worker = undefined;
  }

  private start(): Worker | undefined {
    if (this.worker) return this.worker;
    try {
      const worker = new Worker(new URL('./ai.worker.js', import.meta.url));
      worker.on('message', (response: AiResponse) => {
        const entry = this.pending.get(response.id);
        if (!entry) return;
        this.pending.delete(response.id);
        if ('error' in response) entry.reject(new Error(response.error));
        else entry.resolve(response.col);
      });
      // A crash: fail what was waiting; the next request starts a new worker.
      worker.on('error', (error) => this.fail(worker, error));
      worker.on('exit', () => this.fail(worker, new Error('AI worker stopped')));
      this.worker = worker;
      return worker;
    } catch (error) {
      this.logger.warn(`AI worker could not start, thinking inline: ${String(error)}`);
      return undefined;
    }
  }

  private fail(worker: Worker, error: Error): void {
    if (this.worker === worker) this.worker = undefined;
    for (const entry of this.pending.values()) entry.reject(error);
    this.pending.clear();
  }
}
