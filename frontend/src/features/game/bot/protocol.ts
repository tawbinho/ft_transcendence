import type { GameState } from '../engine';
import type { Difficulty } from './bot';

// Messages exchanged with the bot worker.

export interface BotRequest {
  id: number;
  state: GameState;
  difficulty: Difficulty;
}

export interface BotResponse {
  id: number;
  col: number;
}
