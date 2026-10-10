import { ApiError } from '@/lib/api/errors';
import { setTransport, type ApiRequest, type ApiResponse } from '@/lib/api/http';

/** What a request gets back: data, an ApiError to fail with, or a function that decides from the request. */
export type FakeAnswer = ((request: ApiRequest) => unknown) | ApiError | object | string | number | boolean | null;

/** Answers by request: the key is the method and the path, for example 'GET /matches/live'. */
export type FakeAnswers = Record<string, FakeAnswer>;

export interface FakeApi {
  /** Every request the app sent, in order. */
  requests: ApiRequest[];
  /** Requests nothing was prepared for, as 'METHOD /path'. They fail with a clear message. */
  unanswered: string[];
}

const keyOf = (request: ApiRequest) => `${request.method} ${request.path}`;

/** "GET /users/:name" matches "GET /users/alice" ("/users/alice/matches" does not match). */
function matches(pattern: string, key: string): boolean {
  const patternParts = pattern.split('/');
  const keyParts = key.split('/');
  return (
    patternParts.length === keyParts.length &&
    patternParts.every((part, i) => part.startsWith(':') || part === keyParts[i])
  );
}

function toResponse(answer: unknown): ApiResponse {
  if (answer instanceof ApiError) {
    return { status: answer.status, payload: { error: { code: answer.code, message: answer.message } } };
  }
  return { status: 200, payload: { data: answer } };
}

/**
 * Replaces the network for the rest of the test. Requests are answered from
 * `answers`; exact keys win over keys with :parameters. A request without an
 * answer throws an error that names it.
 *
 *   fakeApi({
 *     'GET /friends': { friends: [], incoming: [], outgoing: [] },
 *     'GET /users/:name': (request) => makeProfile({ displayName: request.path.split('/')[2] }),
 *     'POST /matches': new ApiError('MATCH_NOT_JOINABLE', 'Closed', 409),
 *   });
 */
export function fakeApi(answers: FakeAnswers = {}): FakeApi {
  const api: FakeApi = { requests: [], unanswered: [] };
  const patterns = Object.keys(answers).filter((key) => key.includes(':'));

  setTransport(async (request) => {
    api.requests.push(request);
    const key = keyOf(request);
    const found = key in answers ? key : patterns.find((pattern) => matches(pattern, key));
    if (found === undefined) {
      api.unanswered.push(key);
      throw new Error(`fakeApi has no answer for "${key}". Add it to the answers of this test.`);
    }
    const answer = answers[found];
    return toResponse(typeof answer === 'function' ? answer(request) : answer);
  });
  return api;
}
