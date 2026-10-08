import { ApiError } from './errors';

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type Query = Record<string, string | number | boolean | null | undefined>;

/** One API call, before it is sent. */
export interface ApiRequest {
  method: Method;
  /** The path below /api, for example "/matches/mine". */
  path: string;
  query?: Query;
  /** A JSON value, or FormData for a file upload. */
  body?: unknown;
  signal?: AbortSignal;
}

/** The raw answer: HTTP status and the parsed JSON body (null when empty). */
export interface ApiResponse {
  status: number;
  statusText?: string;
  payload: unknown;
}

/** Something that answers API calls: the network, or the demo server. */
export type Transport = (request: ApiRequest) => Promise<ApiResponse>;

const API_PREFIX = '/api';

export function buildUrl(path: string, query?: Query): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null) params.set(key, String(value));
  }
  const search = params.toString();
  return `${API_PREFIX}${path}${search ? `?${search}` : ''}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readError(payload: unknown): { code: string; message: string } | null {
  if (!isRecord(payload) || !isRecord(payload.error)) return null;
  const { code, message } = payload.error;
  return typeof code === 'string' ? { code, message: typeof message === 'string' ? message : code } : null;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

/**
 * Sends the call to the backend. Every request carries the session cookie
 * (`credentials: 'include'`). An aborted request rethrows the original
 * `AbortError` so callers (and TanStack Query) can ignore it.
 */
export const sendOverNetwork: Transport = async ({ method, path, query, body, signal }) => {
  const isForm = body instanceof FormData;
  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        // For FormData the browser sets the multipart Content-Type itself.
        ...(body === undefined || isForm ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiError('NETWORK_ERROR', 'The server could not be reached', 0);
  }
  return { status: response.status, statusText: response.statusText, payload: await readJson(response) };
};

let transport: Transport = sendOverNetwork;

/**
 * Puts a layer in front of the network. The in-browser demo server (src/demo)
 * uses it to answer the routes the backend does not have yet.
 */
export function setTransport(next: Transport): void {
  transport = next;
}

/**
 * Unwraps the backend's envelope: `{ data }` on success,
 * `{ error: { code, message } }` on failure. Any failure is thrown as an
 * {@link ApiError}.
 */
export function unwrap<T>({ status, statusText, payload }: ApiResponse): T {
  if (status < 200 || status >= 300) {
    const error = readError(payload);
    throw error
      ? new ApiError(error.code, error.message, status)
      : new ApiError(status >= 500 ? 'SERVER_UNAVAILABLE' : 'BAD_RESPONSE', statusText || `HTTP ${status}`, status);
  }

  if (!isRecord(payload) || !('data' in payload)) {
    throw new ApiError('BAD_RESPONSE', 'Unexpected answer from the server', status);
  }
  return payload.data as T;
}

/** Calls the API and returns the `data` of its answer (see {@link unwrap}). */
export async function request<T>(path: string, options: Omit<ApiRequest, 'path'> = { method: 'GET' }): Promise<T> {
  return unwrap<T>(await transport({ ...options, path }));
}

type Options = Omit<ApiRequest, 'method' | 'path' | 'body'>;

export const http = {
  get: <T>(path: string, options?: Options) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Options) => request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: Options) => request<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: Options) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: Options) => request<T>(path, { ...options, method: 'DELETE' }),
};
