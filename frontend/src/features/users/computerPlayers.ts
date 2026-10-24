/**
 * The computer opponents are the backend's: three accounts that nobody logs in as
 * (backend/src/modules/matches/bot.service.ts).
 */
export const COMPUTER_PLAYERS = [
  { level: 'easy', displayName: 'AI_Easy' },
  { level: 'medium', displayName: 'AI_Medium' },
  { level: 'hard', displayName: 'AI_Hard' },
] as const;

/** The level picked at first on the computer page. */
export const DEFAULT_COMPUTER_PLAYER = 'AI_Medium';

/**
 * They are stored as ordinary accounts, so the server lists them next to real people. They cannot
 * be friends, so the Friends area, the player search and the leaderboard hide them.
 */
export function isComputerPlayer(user: { displayName: string; isBot?: boolean }): boolean {
  return user.isBot === true || COMPUTER_PLAYERS.some((computer) => computer.displayName === user.displayName);
}

/** The same list without the computer opponents. */
export function withoutComputerPlayers<T extends { displayName: string; isBot?: boolean }>(users: T[]): T[] {
  return users.filter((user) => !isComputerPlayer(user));
}
