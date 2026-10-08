export type GameRuleErrorCode =
  | 'INVALID_SETTINGS' // the board size or the win length is not allowed
  | 'INVALID_COLUMN' // the column does not exist
  | 'COLUMN_FULL' // the column has no free square left
  | 'GAME_OVER'; // the game already ended

export class GameRuleError extends Error {
  constructor(
    readonly code: GameRuleErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'GameRuleError';
  }
}
