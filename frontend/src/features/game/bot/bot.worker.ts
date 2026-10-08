import { chooseMove } from './bot';
import type { BotRequest, BotResponse } from './protocol';

// Runs the search off the main thread, so the page stays responsive while
// the computer thinks.
self.addEventListener('message', (event: MessageEvent<BotRequest>) => {
  const { id, state, difficulty } = event.data;
  const response: BotResponse = { id, col: chooseMove(state, difficulty) };
  self.postMessage(response);
});
