import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { authKeys } from '@/features/auth/hooks';
import { ApiError, isUnauthorized } from '@/lib/api/errors';

// Client errors (4xx) will not fix themselves: retrying only delays the
// message. Network and server errors get two more tries.
function shouldRetry(failureCount: number, error: Error): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
  return failureCount < 2;
}

export function createQueryClient(): QueryClient {
  // When any request answers UNAUTHORIZED the session has ended (expired, or
  // logged out in another tab). Forgetting the user sends protected pages
  // back to the login screen.
  const onError = (error: Error) => {
    if (isUnauthorized(error)) queryClient.setQueryData(authKeys.me, null);
  };

  const queryClient = new QueryClient({
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
    defaultOptions: {
      queries: { retry: shouldRetry, staleTime: 10_000 },
      mutations: { retry: false },
    },
  });
  return queryClient;
}
