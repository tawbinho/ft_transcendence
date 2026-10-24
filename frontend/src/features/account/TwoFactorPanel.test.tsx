import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@/i18n';
import { authApi } from '@/features/auth/api';
import { ApiError } from '@/lib/api/errors';
import { TwoFactorPanel } from './TwoFactorPanel';

vi.mock('@/features/auth/api', () => ({ authApi: { twoFactorEnabled: vi.fn() } }));

const twoFactorEnabled = vi.mocked(authApi.twoFactorEnabled);

function renderPanel() {
  // A fresh client each time, like a page reload: nothing is remembered.
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <TwoFactorPanel />
    </QueryClientProvider>,
  );
}

describe('TwoFactorPanel after a reload', () => {
  afterEach(() => {
    cleanup();
    twoFactorEnabled.mockReset();
  });

  it('offers only "Turn off" when two-factor is on', async () => {
    twoFactorEnabled.mockResolvedValue(true);
    renderPanel();
    expect(await screen.findByRole('button', { name: 'Turn off' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Turn on' })).toBeNull();
    expect(screen.getByText('On')).toBeTruthy();
  });

  it('offers only "Turn on" when two-factor is off', async () => {
    twoFactorEnabled.mockResolvedValue(false);
    renderPanel();
    expect(await screen.findByRole('button', { name: 'Turn on' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Turn off' })).toBeNull();
    expect(screen.getByText('Off')).toBeTruthy();
  });

  it('shows no button, but a retry, when the server could not be asked', async () => {
    twoFactorEnabled.mockRejectedValue(new ApiError('NETWORK_ERROR', 'down', 0));
    renderPanel();
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Turn on' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Turn off' })).toBeNull();
  });
});
