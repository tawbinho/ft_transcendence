import { legalMoves } from '../engine/game.engine.js';
import type { GameState, Seat } from '../engine/game.types.js';

// WHY THIS FILE EXISTS
// The computer opponent: given a game, it picks a column. PURE (no Nest, no
// database), built on the engine's own state, and it works on any board size
// and any winLength because it never assumes 7 x 6 or four in a row.
//
// HOW IT THINKS, in order (stopping at the first step that decides):
//  1. If it can win right now, it wins.
//  2. If the opponent threatens to win next move, it blocks (the lower levels
//     sometimes MISS the threat, like a distracted human).
//  3. Sometimes it "slips": it plays a random move that at least does not hand
//     the opponent a win above it. The lower the level, the more often.
//  4. Otherwise it LOOKS AHEAD with minimax: it imagines its move, the best
//     answer, its best reply... as far as the level and the clock allow
//     (iterative deepening: depth 1, then 2, then 3..., keeping the result of
//     the deepest depth it finished). A position is scored by counting, in every
//     possible line of `winLength` squares, how close each side is to filling
//     it. Alpha-beta pruning skips branches that cannot change the result.
//     Among equally good moves it picks one at random, so it does not play the
//     same game every time.
// It is NOT perfect on purpose: easy and medium make mistakes, and even hard
// slips now and then and has a time limit, so a human can beat it.

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

interface Profile {
  maxDepth: number; // how many moves ahead, at most
  timeBudgetMs: number; // stop deepening after this long
  slipChance: number; // chance of a careless (but not suicidal) move
  missThreatChance: number; // chance of not blocking an immediate threat
}

const PROFILES: Record<Difficulty, Profile> = {
  easy: { maxDepth: 2, timeBudgetMs: 150, slipChance: 0.4, missThreatChance: 0.3 },
  medium: { maxDepth: 4, timeBudgetMs: 400, slipChance: 0.12, missThreatChance: 0 },
  hard: { maxDepth: 12, timeBudgetMs: 900, slipChance: 0.04, missThreatChance: 0 },
};

export interface ChooseOptions {
  random?: () => number; // replaced by a fixed sequence in tests
  timeBudgetMs?: number; // replaces the level's time limit (tests)
}

const WIN = 1_000_000; // score of a won game; sooner wins score higher
const INFINITY = Number.POSITIVE_INFINITY;

export function chooseMove(
  state: GameState,
  difficulty: Difficulty,
  options: ChooseOptions = {},
): number {
  const profile = PROFILES[difficulty];
  const random = options.random ?? Math.random;

  const moves = legalMoves(state);
  if (moves.length === 0) throw new Error('The game has no legal move');
  if (moves.length === 1) return moves[0]!;

  const me = state.current;
  const them: Seat = me === 1 ? 2 : 1;
  const board = new SearchBoard(state);

  // 1. Win now.
  const wins = moves.filter((col) => board.wouldWin(col, me));
  if (wins.length > 0) return pick(wins, random);

  // 2. Block the opponent's win. (With two threats nothing helps, but we try.)
  const threats = moves.filter((col) => board.wouldWin(col, them));
  if (threats.length > 0) {
    if (random() < profile.missThreatChance) return pick(moves, random);
    return pick(threats, random);
  }

  // 3. A careless move: any move that does not give the opponent a win right
  //    above it.
  if (random() < profile.slipChance) {
    const safe = moves.filter((col) => !board.givesWinAbove(col, me));
    return pick(safe.length > 0 ? safe : moves, random);
  }

  // 4. Think.
  const budget = options.timeBudgetMs ?? profile.timeBudgetMs;
  return pick(bestMoves(board, me, profile.maxDepth, budget), random);
}

function pick(moves: readonly number[], random: () => number): number {
  return moves[Math.min(moves.length - 1, Math.floor(random() * moves.length))]!;
}

// ---------------------------------------------------------------------------
// The board used while thinking
// ---------------------------------------------------------------------------

// A light, MUTABLE copy of the game, because the search tries and takes back
// millions of moves and the engine builds a new state for each one (too slow
// for this). `cells[col * rows + row]`: 0 empty, 1 or 2 a seat.
class SearchBoard {
  readonly cols: number;
  readonly rows: number;
  readonly winLength: number;
  readonly cells: Int8Array;
  readonly heights: Int8Array; // discs in each column
  discs = 0;
  // Columns from the middle outwards: central moves are usually best, so
  // trying them first makes the pruning cut much more.
  readonly order: number[];
  // Every line of winLength squares, as lists of cell indexes (used to score).
  readonly windows: Int32Array[];

  constructor(state: GameState) {
    this.cols = state.settings.cols;
    this.rows = state.settings.rows;
    this.winLength = state.settings.winLength;
    this.cells = new Int8Array(this.cols * this.rows);
    this.heights = new Int8Array(this.cols);
    for (let col = 0; col < this.cols; col++) {
      for (let row = 0; row < this.rows; row++) {
        const cell = state.board[col]![row]!;
        this.cells[col * this.rows + row] = cell;
        if (cell !== 0) {
          this.heights[col] = row + 1;
          this.discs++;
        }
      }
    }
    const middle = (this.cols - 1) / 2;
    this.order = Array.from({ length: this.cols }, (_, col) => col).sort(
      (a, b) => Math.abs(a - middle) - Math.abs(b - middle) || a - b,
    );
    this.windows = this.buildWindows();
  }

  get isFull(): boolean {
    return this.discs === this.cols * this.rows;
  }

  canPlay(col: number): boolean {
    return this.heights[col]! < this.rows;
  }

  // Drops a disc and returns the row where it landed.
  play(col: number, seat: Seat): number {
    const row = this.heights[col]!;
    this.cells[col * this.rows + row] = seat;
    this.heights[col] = row + 1;
    this.discs++;
    return row;
  }

  // Takes the last disc of a column back.
  undo(col: number): void {
    const row = this.heights[col]! - 1;
    this.cells[col * this.rows + row] = 0;
    this.heights[col] = row;
    this.discs--;
  }

  // Does the disc at (col, row) belong to a line of winLength or more? Looks
  // along the four directions, both ways.
  connects(col: number, row: number, seat: Seat): boolean {
    for (const [dc, dr] of DIRECTIONS) {
      let run = 1;
      for (const sign of [1, -1]) {
        let c = col + dc * sign;
        let r = row + dr * sign;
        while (
          c >= 0 && c < this.cols && r >= 0 && r < this.rows &&
          this.cells[c * this.rows + r] === seat
        ) {
          run++;
          c += dc * sign;
          r += dr * sign;
        }
      }
      if (run >= this.winLength) return true;
    }
    return false;
  }

  // Would a disc of `seat` in this column win the game?
  wouldWin(col: number, seat: Seat): boolean {
    const row = this.play(col, seat);
    const won = this.connects(col, row, seat);
    this.undo(col);
    return won;
  }

  // After `seat` plays here, can the opponent win by playing right on top?
  givesWinAbove(col: number, seat: Seat): boolean {
    this.play(col, seat);
    const opponent: Seat = seat === 1 ? 2 : 1;
    const gives = this.canPlay(col) && this.wouldWin(col, opponent);
    this.undo(col);
    return gives;
  }

  private buildWindows(): Int32Array[] {
    const windows: Int32Array[] = [];
    for (let col = 0; col < this.cols; col++) {
      for (let row = 0; row < this.rows; row++) {
        for (const [dc, dr] of DIRECTIONS) {
          const endCol = col + dc * (this.winLength - 1);
          const endRow = row + dr * (this.winLength - 1);
          if (endCol < 0 || endCol >= this.cols || endRow < 0 || endRow >= this.rows) continue;
          const window = new Int32Array(this.winLength);
          for (let i = 0; i < this.winLength; i++) {
            window[i] = (col + dc * i) * this.rows + (row + dr * i);
          }
          windows.push(window);
        }
      }
    }
    return windows;
  }
}

// right, up, up-right, down-right
const DIRECTIONS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
];

// ---------------------------------------------------------------------------
// Looking ahead
// ---------------------------------------------------------------------------

class TimeUp extends Error {}

// The columns that share the best score at the deepest depth finished in time.
function bestMoves(
  board: SearchBoard,
  me: Seat,
  maxDepth: number,
  budgetMs: number,
): number[] {
  const search = new Search(board, Date.now() + budgetMs);
  let candidates = board.order.filter((col) => board.canPlay(col));
  let best = candidates;
  const depthLimit = Math.min(maxDepth, board.cols * board.rows - board.discs);

  for (let depth = 1; depth <= depthLimit; depth++) {
    let scores: Map<number, number>;
    try {
      scores = search.root(candidates, me, depth);
    } catch (error) {
      if (error instanceof TimeUp) break; // keep the previous depth's answer
      throw error;
    }
    const top = Math.max(...scores.values());
    best = candidates.filter((col) => scores.get(col) === top);
    // Try the most promising moves first at the next depth.
    candidates = [...candidates].sort((a, b) => scores.get(b)! - scores.get(a)!);
    // A forced win or loss will not change with more depth.
    if (Math.abs(top) >= WIN - 1000) break;
  }
  return best;
}

class Search {
  private nodes = 0;

  constructor(
    private readonly board: SearchBoard,
    private readonly deadline: number,
  ) {}

  // Scores every candidate first move for `me` by looking `depth` moves ahead.
  // Moves that are clearly worse than the best so far get a bound instead of
  // an exact score: enough, since only the best ones are used.
  root(candidates: number[], me: Seat, depth: number): Map<number, number> {
    const scores = new Map<number, number>();
    const them: Seat = me === 1 ? 2 : 1;
    let best = -INFINITY;
    for (const col of candidates) {
      const row = this.board.play(col, me);
      const score = this.board.connects(col, row, me)
        ? WIN
        : -this.negamax(depth - 1, -INFINITY, -(best - 1), them, 2);
      this.board.undo(col);
      scores.set(col, score);
      best = Math.max(best, score);
    }
    return scores;
  }

  // The value of the position for `player`, who is to move: the best of their
  // moves, where each move is worth the NEGATIVE of the opponent's best reply
  // (what is good for one side is bad for the other: "negamax").
  // alpha and beta are the pruning window: a branch that cannot land inside it
  // is abandoned.
  private negamax(depth: number, alpha: number, beta: number, player: Seat, ply: number): number {
    if ((++this.nodes & 255) === 0 && Date.now() > this.deadline) throw new TimeUp();

    if (this.board.isFull) return 0; // a draw
    if (depth <= 0) return this.evaluate(player);

    const opponent: Seat = player === 1 ? 2 : 1;
    let best = -INFINITY;
    for (const col of this.board.order) {
      if (!this.board.canPlay(col)) continue;
      const row = this.board.play(col, player);
      // Winning sooner is better than winning later: subtract the ply.
      const score = this.board.connects(col, row, player)
        ? WIN - ply
        : -this.negamax(depth - 1, -beta, -alpha, opponent, ply + 1);
      this.board.undo(col);
      if (score > best) best = score;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break; // the opponent would never allow this line
    }
    return best;
  }

  // How good is the board for `player`? In every line of winLength squares
  // that the other side has not blocked, the more discs a side has, the better
  // (and it grows fast: three out of four is worth much more than two). The
  // opponent's lines count against us. A small bonus favours central discs.
  private evaluate(player: Seat): number {
    const { board } = this;
    const cells = board.cells;
    let score = 0;
    for (const window of board.windows) {
      let mine = 0;
      let theirs = 0;
      for (const index of window) {
        const cell = cells[index]!;
        if (cell === player) mine++;
        else if (cell !== 0) theirs++;
      }
      if (mine > 0 && theirs === 0) score += LINE_VALUE[mine]!;
      else if (theirs > 0 && mine === 0) score -= LINE_VALUE[theirs]!;
    }
    const middle = (board.cols - 1) / 2;
    for (let col = 0; col < board.cols; col++) {
      for (let row = 0; row < board.heights[col]!; row++) {
        const cell = cells[col * board.rows + row]!;
        const bonus = middle - Math.abs(col - middle);
        score += cell === player ? bonus : -bonus;
      }
    }
    return score;
  }
}

// What a line is worth with 0, 1, 2... discs of one side: 1, 4, 16, 64...
const LINE_VALUE: readonly number[] = Array.from({ length: 16 }, (_, k) =>
  k === 0 ? 0 : 4 ** (k - 1),
);
