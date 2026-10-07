// WHY THIS FILE EXISTS
// The engine reports a broken rule with its own error type, not a Nest or an
// HTTP error, so the engine stays free of any framework. The match service
// will catch these and turn them into AppError (with an HTTP status) for the
// API.
export type GameRuleErrorCode =
  | 'INVALID_SETTINGS' // the board size or the win length is not allowed
  | 'INVALID_COLUMN' // the column does not exist (negative, too large, not a whole number)
  | 'COLUMN_FULL' // the column has no free square left
  | 'GAME_OVER'; // the game already ended (won or draw)

export class GameRuleError extends Error {
  constructor(
    // Stable identifier, safe to compare in code and tests.
    public readonly code: GameRuleErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'GameRuleError';
  }
}
