import type { TFunction } from 'i18next';
import type { GameStatusTone } from '@/features/game/components/GameStatus';
import type { Seat } from '@/features/game/engine';
import { isMyTurn, opponentOf, outcomeOf, playerInSeat } from '@/features/matches/model';
import type { Match } from '@/features/matches/types';

// The words of an online match, as plain functions so they can be tested without a screen.

export function playerName(match: Match, seat: Seat): string {
  return playerInSeat(match, seat)?.displayName ?? '?';
}

/** The name on a player tag; yours says "(you)". */
export function playerLabel(match: Match, seat: Seat, t: TFunction): string {
  const name = playerName(match, seat);
  return seat === match.yourSeat ? `${name} (${t('online.you')})` : name;
}

/** "Your turn", "Waiting for bob…" while playing, then the result. */
export function matchStatus(match: Match, t: TFunction): string {
  if (match.status === 'in_progress') {
    return isMyTurn(match)
      ? t('game.yourTurn')
      : t('online.waitingFor', { name: opponentOf(match)?.displayName ?? '?' });
  }
  switch (outcomeOf(match)) {
    case 'won':
      return t('online.resultWon');
    case 'lost':
      return t('online.resultLost');
    case 'draw':
      return t('online.resultDraw');
    default:
      return t('online.resultCancelled');
  }
}

/** Why the match ended early (resignation, a player who left), or null. */
export function endReasonText(match: Match, t: TFunction): string | null {
  const loser = match.players.find((player) => player.result === 'loss');
  if (!loser) return null;
  if (match.endReason === 'resign') {
    return loser.seat === match.yourSeat
      ? t('online.youResigned')
      : t('online.byResignation', { name: loser.displayName });
  }
  if (match.endReason === 'disconnect') return t('online.byDisconnect', { name: loser.displayName });
  return null;
}

/** The second line of the banner: why it ended early, or how many moves a finished game took. */
export function matchDetail(match: Match, t: TFunction): string | null {
  const reason = endReasonText(match, t);
  if (reason) return reason;
  const moves = match.game.moveCount;
  if (match.status !== 'finished') return null;
  if (match.endReason === 'win') return t('game.wonDetail', { n: match.settings.winLength, moves });
  if (match.endReason === 'draw') return t('game.drawDetail', { moves });
  return null;
}

export function matchTone(match: Match): GameStatusTone {
  if (match.status === 'in_progress') return 'none';
  switch (outcomeOf(match)) {
    case 'won':
      return 'win';
    case 'lost':
      return 'loss';
    case 'draw':
      return 'draw';
    default:
      return 'over';
  }
}

/** What a screen reader hears: the last move and, once the match is over, the result and its detail. */
export function matchAnnouncement(match: Match, t: TFunction): string {
  const { lastMove, moves } = match.game;
  const lastSeat: Seat = moves.length % 2 === 1 ? 1 : 2;
  const parts = [lastMove && t('game.playedColumn', { name: playerName(match, lastSeat), n: lastMove.col + 1 })];
  if (match.status !== 'in_progress') parts.push(matchStatus(match, t), matchDetail(match, t));
  return parts.filter(Boolean).join(' ');
}
