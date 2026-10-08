import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { MemoryRouter, RouterProvider, createMemoryRouter } from 'react-router';
import { routes } from '@/app/router';
import { createQueryClient } from '@/app/queryClient';
import { authKeys } from '@/features/auth/hooks';
import type { User } from '@/features/auth/types';
import i18n from '@/i18n';

interface Options {
  /**
   * Who is logged in. A user or null (a visitor) is placed in the cache, so
   * the page does not ask the API. Leave it out to make the page ask
   * `GET /auth/me`, which fakeApi must then answer.
   */
  user?: User | null;
}

/** The app's query client, but a failing request is not tried again (tests do not wait for retries). */
function createTestQueryClient({ user }: Options): QueryClient {
  const client = createQueryClient();
  client.setDefaultOptions({ queries: { retry: false, staleTime: 10_000 }, mutations: { retry: false } });
  if (user !== undefined) client.setQueryData(authKeys.me, user);
  return client;
}

/**
 * Renders a component with what every page has: the query client, the router
 * and English texts. Returns Testing Library's helpers plus `events` (user-event)
 * and `queryClient`.
 */
export function renderWithProviders(ui: ReactElement, { user, route = '/' }: Options & { route?: string } = {}) {
  void i18n.changeLanguage('en');
  const queryClient = createTestQueryClient({ user });
  const result = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...result, events: userEvent.setup(), queryClient };
}

/**
 * Renders the whole app at a URL, with the real route table and layout.
 * Pages load lazily: wait for them with `await screen.findByRole('heading', { level: 1 })`.
 */
export function renderRoute(path: string, { user }: Options = {}) {
  void i18n.changeLanguage('en');
  const queryClient = createTestQueryClient({ user });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const result = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { ...result, events: userEvent.setup(), queryClient, router };
}
