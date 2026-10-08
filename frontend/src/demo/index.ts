import type { DemoFeature } from '@/config';
import type { User } from '@/features/auth/types';
import { sendOverNetwork, setTransport, unwrap, type ApiRequest, type ApiResponse } from '@/lib/api/http';
import { emitRealtime } from '@/lib/realtime/bus';
import { clearDb, loadDb, saveDb, type DemoDb, type DemoTask } from './db';
import { DemoError, DemoRouter, failure, ok, PASS, Reply, unauthorized, type DemoContext } from './router';
import { chatRoutes } from './routes/chat';
import { friendRoutes } from './routes/friends';
import { matchRoutes } from './routes/matches';
import { tournamentRoutes } from './routes/tournaments';
import { userRoutes } from './routes/users';
import { seedViewer, seedWorld } from './seed';
import { tick } from './simulation';
import { withProfileChanges, type Session } from './views';
import type { World } from './world';

// THE DEMO SERVER
// Answers, inside the browser, the API routes the backend does not have yet
// (docs/api-contract.md), with made-up players and data saved in
// localStorage. It sits in front of the network (setTransport): requests for
// the enabled demo features are answered here, everything else (login,
// real matches...) still goes to the backend. Once the backend serves every
// route, set VITE_DEMO_FEATURES to an empty value; this folder can then be
// deleted with the lines that load it (main.tsx and layout/DemoBanner.tsx).

/** Set by resetDemoData: nothing may be saved any more. */
let stopped = false;
let stopWorld = () => {};

/** How long the demo server "takes" to answer, like a real network. */
const LATENCY_MS: [number, number] = [60, 220];

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });
}

export function installDemoServer(features: ReadonlySet<DemoFeature>): void {
  const db: DemoDb = loadDb() ?? seedWorld();
  const network = sendOverNetwork;

  // The logged-in user, asked from the real backend and remembered briefly.
  let cachedUser: { user: User; at: number } | null = null;
  let last: Session | null = null;

  async function realViewer(): Promise<User | null> {
    if (cachedUser && Date.now() - cachedUser.at < 10_000) return cachedUser.user;
    // A failure (rate limit, server error...) is thrown as the backend sent it:
    // it does not mean that nobody is logged in.
    const user = unwrap<User | null>(await network({ method: 'GET', path: '/auth/me' }));
    cachedUser = user ? { user, at: Date.now() } : null;
    return user;
  }

  function sessionFor(user: User): Session {
    const state = (db.viewers[user.id] ??= seedViewer(db));
    last = { db, viewer: withProfileChanges(user, state), state };
    return last;
  }

  const world: World = {
    db,
    session: async (ctx) => sessionFor(await ctx.viewer()),
    lastSession: () => last,
    schedule: (task: DemoTask) => db.tasks.push(task),
    emit: emitRealtime,
  };

  const router = new DemoRouter();
  userRoutes(router, world);
  friendRoutes(router, world);
  chatRoutes(router, world);
  matchRoutes(router, world);
  tournamentRoutes(router, world);

  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  const saveSoon = () => {
    saveTimer ??= setTimeout(() => {
      saveTimer = null;
      if (!stopped) saveDb(db);
    }, 500);
  };
  // A reload or a closed tab must not lose a change still waiting to be saved.
  window.addEventListener('pagehide', () => {
    if (saveTimer === null) return;
    clearTimeout(saveTimer);
    saveTimer = null;
    if (!stopped) saveDb(db);
  });

  setTransport(async (request: ApiRequest): Promise<ApiResponse> => {
    // Logging in or out changes who the viewer is.
    if (request.path.startsWith('/auth/') && request.path !== '/auth/me') {
      cachedUser = null;
      last = null;
    }

    const found = router.match(request, features);
    if (!found) return network(request);

    const query: Record<string, string> = {};
    for (const [key, value] of Object.entries(request.query ?? {})) {
      if (value !== undefined && value !== null) query[key] = String(value);
    }
    const ctx: DemoContext = {
      params: found.params,
      query,
      body: request.body,
      viewer: async () => {
        const user = await realViewer();
        if (!user) throw unauthorized();
        return user;
      },
      network,
      passThrough: () => network(request),
    };

    let response: ApiResponse;
    try {
      const result = await found.route.handler(ctx);
      if (result === PASS) return network(request);
      if (result instanceof Reply) return result.response;
      response = ok(result);
    } catch (error) {
      if (!(error instanceof DemoError)) throw error;
      response = failure(error);
    }
    saveSoon();
    await wait(LATENCY_MS[0] + Math.random() * (LATENCY_MS[1] - LATENCY_MS[0]), request.signal);
    return response;
  });

  // The world moves on by itself: replies, moves, tournaments, presence.
  const timer = setInterval(() => {
    if (tick(world)) saveSoon();
  }, 1000);
  stopWorld = () => clearInterval(timer);
}

/** Forgets the demo world; it is created again on the next page load. */
export function resetDemoData(): void {
  stopped = true;
  stopWorld();
  clearDb();
}
