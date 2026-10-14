// Build-time settings, read from the environment (see .env.example).
//
// REALTIME
// With VITE_REALTIME=socket the app opens a Socket.IO connection for live
// updates (matches, presence, friends, chat, tournaments). Anything else: the
// pages refresh themselves by polling. Both work; sockets make updates instant.

export const config = {
  realtime: import.meta.env.VITE_REALTIME === 'socket' ? 'socket' : 'polling',
} as const;
