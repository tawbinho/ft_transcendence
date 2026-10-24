import { useCallback } from 'react';
import { useSearchParams, type URLSearchParamsInit } from 'react-router';

/** The search params of a page that keeps its filters and page number in the URL. */
export function useUrlParams() {
  const [params, setParams] = useSearchParams();
  const replaceParams = useCallback(
    (next: URLSearchParamsInit) => setParams(next, { replace: true, flushSync: true }),
    [setParams],
  );
  return [params, replaceParams] as const;
}
