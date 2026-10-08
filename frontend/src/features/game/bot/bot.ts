import { legalMoves, type GameState, type Seat } from '../engine';

// The computer opponent: a negamax search with alpha-beta pruning and
// iterative deepening, over a compact mutable copy of the board (the
// immutable engine is too slow to search millions of positions).
//
// It plays like a person rather than a perfect machine. It never misses a
// win in one move, and it blocks the opponent's win in one (the easy level
// sometimes overlooks it). Apart from that it sometimes "slips": it plays a
// move that looks fine (it does not hand over a win on the next turn) without
// thinking it through. Each level changes how deep it looks, how long it
// thinks and how often it slips.

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

interface Profile {
  /** Deepest search, in plies (one ply = one disc). */
  maxDepth: number;
  /** Deepening stops after this long; the last complete depth is used. */
  timeBudgetMs: number;
  /** Chance of playing a quick, unchecked move instead of searching. */
  slipChance: number;
  /** Chance of not noticing that the opponent wins next move. */
  missThreatChance: number;
}

const PROFILES: Record<Difficulty, Profile> = {
  easy: { maxDepth: 2, timeBudgetMs: 150, slipChance: 0.4, missThreatChance: 0.3 },
  medium: { maxDepth: 4, timeBudgetMs: 400, slipChance: 0.12, missThreatChance: 0 },
  hard: { maxDepth: 16, timeBudgetMs: 900, slipChance: 0.04, missThreatChance: 0 },
};

export interface ChooseMoveOptions {
  /** Random numbers in [0, 1); injectable so tests are reproducible. */
  random?: () => number;
  /** Clock in milliseconds; injectable for tests. */
  now?: () => number;
  /** Overrides the difficulty's thinking time. */
  timeBudgetMs?: number;
}

/** Picks a column for the player whose turn it is in `state`. */
export function chooseMove(state: GameState, difficulty: Difficulty, options: ChooseMoveOptions = {}): number {
  const random = options.random ?? Math.random;
  const now = options.now ?? (() => performance.now());
  const profile = PROFILES[difficulty];

  const moves = legalMoves(state);
  if (moves.length === 0) throw new Error('The game has no legal move left');
  if (moves.length === 1) return moves[0]!;

  const search = new Search(state, now, now() + (options.timeBudgetMs ?? profile.timeBudgetMs));
  const me = state.current;

  const wins = search.winningMoves(me);
  if (wins.length > 0) return pickOne(wins, random);

  const threats = search.winningMoves(other(me));
  if (threats.length > 0) {
    if (random() < profile.missThreatChance) return pickOne(moves, random);
    return pickOne(threats, random);
  }

  if (random() < profile.slipChance) {
    const safe = search.safeMoves();
    return pickOne(safe.length > 0 ? safe : moves, random);
  }

  return pickOne(search.bestMoves(profile.maxDepth), random);
}

function pickOne(moves: readonly number[], random: () => number): number {
  return moves[Math.min(moves.length - 1, Math.floor(random() * moves.length))]!;
}

// Larger than any heuristic score; a win found at ply p scores WIN - p, so
// faster wins (and slower losses) are preferred.
const WIN = 1_000_000;
const TIMEOUT = { reason: 'search timeout' };

const DIRECTIONS: readonly (readonly [number, number])[] = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
];

const other = (seat: Seat): Seat => (seat === 1 ? 2 : 1);

class Search {
  private readonly cols: number;
  private readonly rows: number;
  private readonly winLength: number;
  private readonly total: number;
  /** cells[col * rows + row]: 0 empty, 1 or 2 a disc. */
  private readonly cells: Int8Array;
  /** Discs in each column. */
  private readonly heights: Int8Array;
  /** Every line of winLength squares, as cell indexes. */
  private readonly windows: Int16Array[];
  /** Score of a window holding n discs of one player only. */
  private readonly windowScore: number[];
  /** Small bonus for discs near the middle, which take part in more lines. */
  private readonly columnBonus: number[];
  /** Columns from the middle outwards: good moves first prune more. */
  private readonly order: number[];
  private readonly player: Seat;
  private moveCount: number;
  private nodes = 0;

  constructor(
    state: GameState,
    private readonly now: () => number,
    private readonly deadline: number,
  ) {
    const { cols, rows, winLength } = state.settings;
    this.cols = cols;
    this.rows = rows;
    this.winLength = winLength;
    this.total = cols * rows;
    this.player = state.current;
    this.moveCount = state.moveCount;

    this.cells = new Int8Array(cols * rows);
    this.heights = new Int8Array(cols);
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        const cell = state.board[col]![row]!;
        this.cells[col * rows + row] = cell;
        if (cell !== 0) this.heights[col] = row + 1;
      }
    }

    this.windows = [];
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        for (const [dc, dr] of DIRECTIONS) {
          const endCol = col + dc * (winLength - 1);
          const endRow = row + dr * (winLength - 1);
          if (endCol < 0 || endCol >= cols || endRow < 0 || endRow >= rows) continue;
          const window = new Int16Array(winLength);
          for (let i = 0; i < winLength; i++) window[i] = (col + dc * i) * rows + (row + dr * i);
          this.windows.push(window);
        }
      }
    }

    this.windowScore = Array.from({ length: winLength + 1 }, (_, n) =>
      n === 0 ? 0 : n === winLength - 1 ? 50 : n === winLength - 2 ? 5 : 1,
    );
    const middle = (cols - 1) / 2;
    this.columnBonus = Array.from({ length: cols }, (_, col) => Math.max(0, 3 - Math.floor(Math.abs(col - middle))));
    this.order = Array.from({ length: cols }, (_, col) => col).sort(
      (a, b) => Math.abs(a - middle) - Math.abs(b - middle),
    );
  }

  /** Columns where `player` would connect right now. */
  winningMoves(player: Seat): number[] {
    return this.order.filter((col) => this.canPlay(col) && this.wouldWin(col, player));
  }

  /** Columns after which the opponent cannot win with their next disc. */
  safeMoves(): number[] {
    const opponent = other(this.player);
    return this.order.filter((col) => {
      if (!this.canPlay(col)) return false;
      this.play(col, this.player);
      const handsOver = this.order.some((reply) => this.canPlay(reply) && this.wouldWin(reply, opponent));
      this.undo(col);
      return !handsOver;
    });
  }

  /** The columns that share the best score at the deepest completed depth. */
  bestMoves(maxDepth: number): number[] {
    let candidates = this.order.filter((col) => this.canPlay(col));
    let best = candidates;
    const depthLimit = Math.min(maxDepth, this.total - this.moveCount);
    for (let depth = 1; depth <= depthLimit; depth++) {
      let scores: Map<number, number>;
      try {
        scores = this.searchRoot(candidates, depth);
      } catch (error) {
        // The board copy is left mid-search; it is not used again.
        if (error === TIMEOUT) break;
        throw error;
      }
      const top = Math.max(...scores.values());
      best = candidates.filter((col) => scores.get(col) === top);
      // Search the most promising moves first at the next depth.
      candidates = [...candidates].sort((a, b) => scores.get(b)! - scores.get(a)!);
      // A forced win or loss is already certain: looking deeper changes nothing.
      if (Math.abs(top) >= WIN - this.total) break;
    }
    return best;
  }

  // Scores every root move. Each move is searched with the window
  // (best - 1, +inf): a move worse than the best so far comes back as an upper
  // bound below it, while a move EQUAL to the best gets its exact score, so all
  // equally good moves are found and one can be picked at random.
  private searchRoot(candidates: readonly number[], depth: number): Map<number, number> {
    const scores = new Map<number, number>();
    let best = -Infinity;
    for (const col of candidates) {
      const index = this.play(col, this.player);
      const score = this.isWin(index, this.player)
        ? WIN - 1
        : -this.negamax(depth - 1, -Infinity, -(best - 1), other(this.player), 2, depth > 1);
      this.undo(col);
      scores.set(col, score);
      if (score > best) best = score;
    }
    return scores;
  }

  private negamax(depth: number, alpha: number, beta: number, player: Seat, ply: number, canTimeOut: boolean): number {
    if (canTimeOut && (++this.nodes & 1023) === 0 && this.now() > this.deadline) throw TIMEOUT;
    if (this.moveCount === this.total) return 0;

    // Winning right now beats anything a deeper search could find.
    for (const col of this.order) {
      if (this.canPlay(col) && this.wouldWin(col, player)) return WIN - ply;
    }
    if (depth <= 0) return this.evaluate(player);

    let best = -Infinity;
    for (const col of this.order) {
      if (!this.canPlay(col)) continue;
      this.play(col, player);
      const score = -this.negamax(depth - 1, -beta, -alpha, other(player), ply + 1, canTimeOut);
      this.undo(col);
      if (score > best) best = score;
      if (score > alpha) alpha = score;
      if (alpha >= beta) break;
    }
    return best;
  }

  /** Static score of the position for `player` (positive is good for them). */
  private evaluate(player: Seat): number {
    let score = 0;
    for (const window of this.windows) {
      let mine = 0;
      let theirs = 0;
      for (let i = 0; i < window.length; i++) {
        const cell = this.cells[window[i]!];
        if (cell === player) mine++;
        else if (cell !== 0) theirs++;
      }
      if (theirs === 0) score += this.windowScore[mine]!;
      else if (mine === 0) score -= this.windowScore[theirs]!;
    }
    for (let col = 0; col < this.cols; col++) {
      const bonus = this.columnBonus[col]!;
      if (bonus === 0) continue;
      for (let row = 0; row < this.heights[col]!; row++) {
        score += this.cells[col * this.rows + row] === player ? bonus : -bonus;
      }
    }
    return score;
  }

  private canPlay(col: number): boolean {
    return this.heights[col]! < this.rows;
  }

  private play(col: number, player: Seat): number {
    const index = col * this.rows + this.heights[col]!;
    this.cells[index] = player;
    this.heights[col] = this.heights[col]! + 1;
    this.moveCount++;
    return index;
  }

  private undo(col: number): void {
    const height = this.heights[col]! - 1;
    this.heights[col] = height;
    this.cells[col * this.rows + height] = 0;
    this.moveCount--;
  }

  private wouldWin(col: number, player: Seat): boolean {
    const index = this.play(col, player);
    const wins = this.isWin(index, player);
    this.undo(col);
    return wins;
  }

  /** Whether the disc at `index` completes a line for `player`. */
  private isWin(index: number, player: Seat): boolean {
    const col = Math.floor(index / this.rows);
    const row = index % this.rows;
    const owns = (c: number, r: number) =>
      c >= 0 && c < this.cols && r >= 0 && r < this.rows && this.cells[c * this.rows + r] === player;

    for (const [dc, dr] of DIRECTIONS) {
      let run = 1;
      for (let c = col + dc, r = row + dr; owns(c, r); c += dc, r += dr) run++;
      for (let c = col - dc, r = row - dr; owns(c, r); c -= dc, r -= dr) run++;
      if (run >= this.winLength) return true;
    }
    return false;
  }
}
