import type { TFunction } from 'i18next';
import type { GameStatusTone } from '@/features/game/components/GameStatus';
import type { GameState, Seat } from '@/features/game/engine';

// The words of a game played in this browser, as plain functions so they can be tested without a screen.

/** Who sits where: the computer's seat (null for two people) and the names typed for a same-screen game. */
export interface Players {
  computerSeat: Seat | null;
  /** '' = no name typed, use "Player 1" / "Player 2". */
  names: [string, string];
}

export function seatName(seat: Seat, { computerSeat, names }: Players, t: TFunction): string {
  if (computerSeat !== null) return seat === computerSeat ? t('offline.computer') : t('offline.you');
  return names[seat - 1] || (seat === 1 ? t('offline.player1') : t('offline.player2'));
}

/** "You win!", "Player 1 wins!", "Draw…" or null while the game goes on. */
export function resultText(game: GameState, players: Players, t: TFunction): string | null {
  if (game.status === 'draw') return t('game.draw');
  if (game.status !== 'won' || game.winner === null) return null;
  if (players.computerSeat !== null) return game.winner === players.computerSeat ? t('game.youLose') : t('game.youWin');
  return t('game.wins', { name: seatName(game.winner, players, t) });
}

/** The second line under a result: how the game ended and after how many moves. */
export function resultDetail(game: GameState, t: TFunction): string | null {
  if (game.status === 'draw') return t('game.drawDetail', { moves: game.moveCount });
  if (game.status === 'won') return t('game.wonDetail', { n: game.settings.winLength, moves: game.moveCount });
  return null;
}

/** The main line of the banner: the result, or whose turn it is. */
export function statusText(game: GameState, players: Players, thinking: boolean, t: TFunction): string {
  const result = resultText(game, players, t);
  if (result) return result;
  if (thinking) return t('offline.thinking');
  if (players.computerSeat !== null) return t('game.yourTurn');
  return t('game.turnOf', { name: seatName(game.current, players, t) });
}

/** Green when the person wins against the computer, red when they lose, grey for the rest. */
export function statusTone(game: GameState, computerSeat: Seat | null): GameStatusTone {
  if (game.status === 'playing') return 'none';
  if (computerSeat === null || game.status !== 'won') return 'over';
  return game.winner === computerSeat ? 'loss' : 'win';
}

/** What a screen reader hears after a move: who played where, and the result if the game ended. */
export function moveAnnouncement(game: GameState, moves: number, players: Players, t: TFunction): string {
  if (!game.lastMove) return '';
  // Seat 1 plays the odd-numbered moves.
  const lastSeat: Seat = moves % 2 === 1 ? 1 : 2;
  const played = t('game.playedColumn', { name: seatName(lastSeat, players, t), n: game.lastMove.col + 1 });
  return [played, resultText(game, players, t)].filter(Boolean).join(' ');
}
