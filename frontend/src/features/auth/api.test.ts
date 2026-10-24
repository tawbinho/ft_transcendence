import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api/errors';
import { http } from '@/lib/api/http';
import { authApi } from './api';

vi.mock('@/lib/api/http', () => ({ http: { get: vi.fn() } }));

const get = vi.mocked(http.get);

describe('authApi.twoFactorEnabled', () => {
  beforeEach(() => {
    get.mockReset();
  });

  it('is true when the server counts the backup codes', async () => {
    get.mockResolvedValue({ remaining: 10 });
    await expect(authApi.twoFactorEnabled()).resolves.toBe(true);
    expect(get).toHaveBeenCalledWith('/auth/2fa/backup-codes', { signal: undefined });
  });

  it('is false when the server says two-factor is not enabled', async () => {
    get.mockRejectedValue(new ApiError('TWO_FACTOR_NOT_ENABLED', 'not enabled', 409));
    await expect(authApi.twoFactorEnabled()).resolves.toBe(false);
  });

  it('does not guess when the answer is another error', async () => {
    get.mockRejectedValue(new ApiError('NETWORK_ERROR', 'down', 0));
    await expect(authApi.twoFactorEnabled()).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });
});
