// Links to pages that take a parameter. Built here, next to the router that
// declares the same URLs, so a URL only ever changes in these two files.

const segment = encodeURIComponent;

export const paths = {
  profile: (displayName: string) => `/users/${segment(displayName)}`,
  chat: (displayName?: string) => (displayName ? `/chat/${segment(displayName)}` : '/chat'),
  match: (id: string) => `/matches/${segment(id)}`,
  tournament: (id: string) => `/tournaments/${segment(id)}`,
  /** The settings page, optionally opened on one section: profile, security, preferences or blocked. */
  settings: (section?: string) => (section ? `/settings/${segment(section)}` : '/settings'),
  /** The online match form with the opponent picked: the match is kept for them, and the chat invites them. */
  challenge: (player: { id: string; displayName: string }) =>
    `/play/online?opponent=${segment(player.displayName)}&invite=${segment(player.id)}`,
};
