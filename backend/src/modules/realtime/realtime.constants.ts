// WHY THIS FILE EXISTS
// The names of the live events and of the rooms, in ONE place. The frontend
// (src/lib/realtime/events.ts) and backend/docs/openapi.yaml (x-realtime) use
// the same names, so a typo here breaks the app silently: keep them in sync.

// Server -> client events.
export const EVENTS = {
  matchUpdate: 'match:update', // the whole match, to everybody watching it
  presence: 'presence', // someone came online or went offline
  friendsUpdate: 'friends:update', // refetch your friends
  tournamentUpdate: 'tournament:update', // { id }: refetch that tournament
} as const;

// Client -> server messages.
export const MESSAGES = {
  matchWatch: 'match:watch',
  matchUnwatch: 'match:unwatch',
} as const;

// A room is a named group of sockets: sending to a room reaches all of them.
// Every tab of a user is in `user:<id>`; everybody looking at a match is in
// `match:<id>`.
export const userRoom = (userId: string): string => `user:${userId}`;
export const matchRoom = (matchId: string): string => `match:${matchId}`;

// How often the server notes that connected users are still here, and checks
// that their login is still valid (see the gateway). Shorter than the minute
// during which someone counts as online.
export const HEARTBEAT_MS = 20_000;

// A socket may watch this many matches at once (its own two rooms included),
// so one client cannot make the server track thousands of rooms.
export const MAX_ROOMS_PER_SOCKET = 30;
