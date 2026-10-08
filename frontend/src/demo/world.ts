import type { RealtimeEvent, RealtimeEvents } from '@/lib/realtime/events';
import type { DemoDb, DemoTask } from './db';
import type { DemoContext } from './router';
import type { Session } from './views';

/** What the route handlers and the simulation share. */
export interface World {
  db: DemoDb;
  /** The logged-in user and their demo state; throws UNAUTHORIZED if logged out. */
  session: (ctx: DemoContext) => Promise<Session>;
  /** The latest logged-in user seen, for the simulation (null before any request). */
  lastSession: () => Session | null;
  schedule: (task: DemoTask) => void;
  /** Pushes a live event to the pages, like the backend's Socket.IO gateway would. */
  emit: <K extends RealtimeEvent>(event: K, payload: RealtimeEvents[K]) => void;
}
