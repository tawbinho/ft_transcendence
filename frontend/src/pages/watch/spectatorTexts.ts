import type { TFunction } from 'i18next';
import type { GameStatusTone } from '@/features/game/components/GameStatus';
import { outcomeOf, playerInSeat } from '@/features/matches/model';
import { seatOfMove } from '@/features/matches/replay';
import type { Match } from '@/features/matches/types';

// The sentences of the spectator page, decided here so they can be tested
// without drawing the page. `t` is i18next's translate function.

export type Translate = TFunction;

type MatchTexts = Pick<Match, 'status' | 'endReason' | 'players' | 'winnerSeat' | 'yourSeat' | 'game'>;

export interface BannerText {
  tone: GameStatusTone;
  /** The big line: whose turn it is, or how the match ended. */
  status: string;
  /** A smaller second line, for example "bob resigned.". */
  detail: string | null;
}

/** The name of the player in the given seat, "?" when nobody sits there. */
export const seatName = (match: Pick<Match, 'players'>, seat: 1 | 2) => playerInSeat(match, seat)?.displayName ?? '?';

/** How a finished match ended: who won (or a draw), and whether someone gave up. */
export function resultText(match: MatchTexts, t: Translate): Pick<BannerText, 'status' | 'detail'> {
  const winner = match.winnerSeat === null ? null : seatName(match, match.winnerSeat);
  const loser = match.players.find((player) => player.result === 'loss');
  const status = winner
    ? t('game.wins', { name: winner })
    : match.status === 'finished'
      ? t('game.draw')
      : t('online.resultCancelled');
  const detail =
    loser && match.endReason === 'resign'
      ? t('online.byResignation', { name: loser.displayName })
      : loser && match.endReason === 'disconnect'
        ? t('online.byDisconnect', { name: loser.displayName })
        : null;
  return { status, detail };
}

/** What the banner says while the match is being played. */
export function liveBanner(match: MatchTexts, t: Translate): BannerText {
  return { tone: 'none', status: t('game.turnOf', { name: seatName(match, match.game.current ?? 1) }), detail: null };
}

/** The colour of the result banner: green or red for a player of the match, grey for a spectator. */
function resultTone(match: MatchTexts): GameStatusTone {
  const outcome = outcomeOf(match);
  if (match.yourSeat === null) return 'over';
  return outcome === 'won' ? 'win' : outcome === 'lost' ? 'loss' : outcome === 'draw' ? 'draw' : 'over';
}

/**
 * The banner of a replay after `step` moves. Before the end it says which disc
 * was just played; on the last move it gives the result of the match.
 */
export function replayBanner(match: MatchTexts, step: number, total: number, t: Translate): BannerText {
  // A match cancelled before any move has nothing to replay: it only has its result.
  if (step === 0 && total > 0) return { tone: 'none', status: t('watch.replay.start'), detail: null };
  if (step < total) {
    const col = match.game.moves[step - 1] ?? 0;
    return {
      tone: 'none',
      status: t('game.playedColumn', { name: seatName(match, seatOfMove(step)), n: col + 1 }),
      detail: null,
    };
  }
  return { tone: resultTone(match), ...resultText(match, t) };
}

/** The text screen readers hear when the replay moves to `step`. */
export function replayAnnouncement(match: MatchTexts, step: number, total: number, t: Translate): string {
  if (total === 0) return resultText(match, t).status;
  if (step === 0) return t('watch.replay.start');
  const col = match.game.moves[step - 1] ?? 0;
  const played = t('watch.replay.played', { step, total, name: seatName(match, seatOfMove(step)), col: col + 1 });
  if (step < total) return played;
  const { status, detail } = resultText(match, t);
  return [played, status, detail].filter(Boolean).join(' ');
}

/** What screen readers hear when a live match gets a new move or ends. */
export function liveAnnouncement(match: MatchTexts, t: Translate): string {
  const { lastMove, moves } = match.game;
  const playing = match.status === 'in_progress';
  const lastSeat = seatOfMove(moves.length);
  const result = playing ? null : resultText(match, t);
  return [
    lastMove && t('game.playedColumn', { name: seatName(match, lastSeat), n: lastMove.col + 1 }),
    result?.status,
    result?.detail,
  ]
    .filter(Boolean)
    .join(' ');
}
