import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { authKeys } from '@/features/auth/hooks';
import { ApiError, isUnauthorized } from '@/lib/api/errors';

const MAX_RETRIES = 2;

// Most client errors (4xx) will not fix themselves: retrying only delays the
// message.
export function shouldRetry(failureCount: number, error: Error): boolean {
  if (failureCount >= MAX_RETRIES) return false;
  if (!(error instanceof ApiError)) return true;
  // Status 0 is how the API client reports a server it could not reach at all.
  return error.status === 0 || error.status === 408 || error.status === 429 || error.status >= 500;
}

/** About one second before the first retry, three before the second. */
export function retryDelay(failureCount: number): number {
  return failureCount === 0 ? 1_000 : 3_000;
}

export function createQueryClient(): QueryClient {
  // When any request answers UNAUTHORIZED the session has ended (expired, or
  // logged out in another tab). Forgetting the user sends protected pages back
  // to the login screen.
  const onError = (error: Error) => {
    if (isUnauthorized(error)) queryClient.setQueryData(authKeys.me, null);
  };

  const queryClient = new QueryClient({
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
    defaultOptions: {
      queries: { retry: shouldRetry, retryDelay, staleTime: 10_000 },
      mutations: { retry: false },
    },
  });
  return queryClient;
}
