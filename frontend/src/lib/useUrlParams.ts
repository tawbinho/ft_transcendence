import { useCallback } from 'react';
import { useSearchParams, type URLSearchParamsInit } from 'react-router';

/**
 * The search params of a page that keeps its filters and page number in the URL.
 *
 * Changes replace the current history entry, so Back leaves the page instead of
 * stepping through every filter. They also render at once (flushSync): the router
 * applies URL changes as a transition by default, and a checkbox or radio that
 * reads its state from the URL would show its old state for a frame after a click.
 * So call the setter from event handlers or timers, never directly in an effect.
 */
export function useUrlParams() {
  const [params, setParams] = useSearchParams();
  const replaceParams = useCallback(
    (next: URLSearchParamsInit) => setParams(next, { replace: true, flushSync: true }),
    [setParams],
  );
  return [params, replaceParams] as const;
}
