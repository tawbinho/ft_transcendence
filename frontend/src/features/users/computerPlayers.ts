/**
 * The computer opponents (AI_Easy, AI_Medium, AI_Hard) are stored as ordinary accounts, so the
 * server lists them next to real people. They cannot be friends, so the Friends area hides them.
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
