import type { DemoFeature } from '@/config';
import type { User } from '@/features/auth/types';
import type { ApiRequest, ApiResponse, Method, Transport } from '@/lib/api/http';

// A tiny request router for the demo server: routes are declared like in the
// backend ("GET /users/:displayName") and answer with the same envelopes.

/** Thrown by a handler to answer `{ error: { code, message } }`. */
export class DemoError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

/** Returned by a handler to let the real backend answer instead. */
export const PASS = Symbol('pass to the backend');

/** Returned by a handler that builds the whole response itself. */
export class Reply {
  constructor(readonly response: ApiResponse) {}
}

export interface DemoContext {
  params: Record<string, string>;
  query: Record<string, string>;
  body: unknown;
  /** The logged-in user (from the real backend), or UNAUTHORIZED. */
  viewer: () => Promise<User>;
  /** Sends any request to the real backend. */
  network: Transport;
  /** Sends this very request to the real backend. */
  passThrough: () => Promise<ApiResponse>;
}

type Handler = (ctx: DemoContext) => unknown;

interface Route {
  method: Method;
  pattern: RegExp;
  keys: string[];
  /** null: always active (the handler passes what is not demo data). */
  feature: DemoFeature | null;
  handler: Handler;
}

export class DemoRouter {
  private readonly routes: Route[] = [];

  add(feature: DemoFeature | null, method: Method, path: string, handler: Handler): void {
    const keys: string[] = [];
    const source = path.replace(/:(\w+)/g, (_, key: string) => {
      keys.push(key);
      return '([^/]+)';
    });
    this.routes.push({ method, pattern: new RegExp(`^${source}$`), keys, feature, handler });
  }

  /** The route answering this request, with its path parameters. */
  match(
    request: ApiRequest,
    enabled: ReadonlySet<DemoFeature>,
  ): { route: Route; params: Record<string, string> } | null {
    for (const route of this.routes) {
      if (route.method !== request.method) continue;
      if (route.feature !== null && !enabled.has(route.feature)) continue;
      const found = route.pattern.exec(request.path);
      if (!found) continue;
      const params: Record<string, string> = {};
      route.keys.forEach((key, index) => {
        params[key] = decodeURIComponent(found[index + 1]!);
      });
      return { route, params };
    }
    return null;
  }
}

export const ok = (data: unknown): ApiResponse => ({ status: 200, payload: { data } });

export const failure = (error: DemoError): ApiResponse => ({
  status: error.status,
  payload: { error: { code: error.code, message: error.message } },
});

// The usual errors, with the backend's codes.
export const notFound = (code: string, message: string) => new DemoError(404, code, message);
export const conflict = (code: string, message: string) => new DemoError(409, code, message);
export const forbidden = (code: string, message: string) => new DemoError(403, code, message);
export const invalid = (message: string) => new DemoError(400, 'VALIDATION_ERROR', message);
export const unauthorized = () => new DemoError(401, 'UNAUTHORIZED', 'You must be logged in');
