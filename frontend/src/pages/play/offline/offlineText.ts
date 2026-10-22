import type { TFunction } from 'i18next';
import type { GameState, Seat } from '@/features/game/engine';

// The words of a same-screen game, as plain functions so they can be tested without a screen.

/** The names typed for the two players; '' = no name typed, use "Player 1" / "Player 2". */
export type Names = [string, string];

export function seatName(seat: Seat, names: Names, t: TFunction): string {
  return names[seat - 1] || (seat === 1 ? t('offline.player1') : t('offline.player2'));
}

/** "Player 1 wins!", "Draw…" or null while the game goes on. */
export function resultText(game: GameState, names: Names, t: TFunction): string | null {
  if (game.status === 'draw') return t('game.draw');
  if (game.status !== 'won' || game.winner === null) return null;
  return t('game.wins', { name: seatName(game.winner, names, t) });
}

/** The second line under a result: how the game ended and after how many moves. */
export function resultDetail(game: GameState, t: TFunction): string | null {
  if (game.status === 'draw') return t('game.drawDetail', { moves: game.moveCount });
  if (game.status === 'won') return t('game.wonDetail', { n: game.settings.winLength, moves: game.moveCount });
  return null;
}

/** The main line of the banner: the result, or whose turn it is. */
export function statusText(game: GameState, names: Names, t: TFunction): string {
  return resultText(game, names, t) ?? t('game.turnOf', { name: seatName(game.current, names, t) });
}

/** What a screen reader hears after a move: who played where, and the result if the game ended. */
export function moveAnnouncement(game: GameState, moves: number, names: Names, t: TFunction): string {
  if (!game.lastMove) return '';
  // Seat 1 plays the odd-numbered moves.
  const lastSeat: Seat = moves % 2 === 1 ? 1 : 2;
  const played = t('game.playedColumn', { name: seatName(lastSeat, names, t), n: game.lastMove.col + 1 });
  return [played, resultText(game, names, t)].filter(Boolean).join(' ');
}
