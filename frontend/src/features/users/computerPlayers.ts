/**
 * The computer opponents are the backend's: three accounts that nobody logs in
 * as (backend/src/modules/matches/bot.service.ts). A match created with one of
 * these names as the opponent is joined at once by the server, which then plays
 * the computer's moves. The app never chooses a move for the computer itself.
 */
export const COMPUTER_PLAYERS = [
  { level: 'easy', displayName: 'AI_Easy' },
  { level: 'medium', displayName: 'AI_Medium' },
  { level: 'hard', displayName: 'AI_Hard' },
] as const;

/** The level picked at first on the computer page. */
export const DEFAULT_COMPUTER_PLAYER = 'AI_Medium';

/**
 * They are stored as ordinary accounts, so the server lists them next to real
 * people. They cannot be friends, so the Friends area, the player search and the
 * leaderboard hide them.
 *
 * The player routes send an `isBot` flag. The friends route sends only a name and a picture,
 * so the name is the fallback: every computer opponent is called "AI_" followed by its level.
 */
export function isComputerPlayer(user: { displayName: string; isBot?: boolean }): boolean {
  return user.isBot === true || user.displayName.startsWith('AI_');
}

/** The same list without the computer opponents. */
export function withoutComputerPlayers<T extends { displayName: string; isBot?: boolean }>(users: T[]): T[] {
  return users.filter((user) => !isComputerPlayer(user));
}
