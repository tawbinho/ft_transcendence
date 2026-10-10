import { ApiError } from '@/lib/api/errors';
import { createQueryClient, retryDelay, shouldRetry } from './queryClient';

const apiError = (status: number) => new ApiError('SOME_CODE', 'message', status);

describe('which failed requests are tried again', () => {
  it.each([408, 429, 500, 502, 503])('retries status %i', (status) => {
    expect(shouldRetry(0, apiError(status))).toBe(true);
  });

  it.each([400, 401, 403, 404, 409, 422])('never retries status %i', (status) => {
    expect(shouldRetry(0, apiError(status))).toBe(false);
  });

  it('retries a server that cannot be reached (status 0)', () => {
    expect(shouldRetry(0, new ApiError('NETWORK_ERROR', 'unreachable', 0))).toBe(true);
  });

  it('retries any other error that is not an ApiError', () => {
    expect(shouldRetry(0, new TypeError('Failed to fetch'))).toBe(true);
  });

  it('retries twice and then gives up', () => {
    expect(shouldRetry(0, apiError(503))).toBe(true);
    expect(shouldRetry(1, apiError(503))).toBe(true);
    expect(shouldRetry(2, apiError(503))).toBe(false);
  });
});

describe('how long to wait', () => {
  it('waits about 1 second, then 3 seconds', () => {
    expect(retryDelay(0)).toBe(1_000);
    expect(retryDelay(1)).toBe(3_000);
  });
});

describe('the app query client', () => {
  it('uses these rules for queries and never retries a mutation', () => {
    const { queries, mutations } = createQueryClient().getDefaultOptions();
    expect(queries?.retry).toBe(shouldRetry);
    expect(queries?.retryDelay).toBe(retryDelay);
    expect(mutations?.retry).toBe(false);
  });
});
