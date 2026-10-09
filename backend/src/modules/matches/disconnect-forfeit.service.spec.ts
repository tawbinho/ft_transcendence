import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PresenceService } from '../users/presence.service.js';
import { DisconnectForfeitService } from './disconnect-forfeit.service.js';
import type { MatchesService } from './matches.service.js';

const ALICE = 'user-alice';
const GRACE_SECONDS = 30;

// Real PresenceService (it only counts sockets here), fake matches and config.
function setup(runningMatches: string[] = ['match-1']) {
  const presence = new PresenceService({} as never);
  const matches = {
    inProgressMatchIdsOf: vi.fn().mockResolvedValue(runningMatches),
    forfeitByDisconnect: vi.fn().mockResolvedValue(true),
  };
  const config = { get: vi.fn().mockReturnValue(GRACE_SECONDS) };
  const service = new DisconnectForfeitService(
    matches as unknown as MatchesService,
    presence,
    config as never,
  );
  service.onModuleInit();
  return { presence, matches, service };
}

// Lets the awaited database call of start() finish.
const flush = () => vi.advanceTimersByTimeAsync(0);

describe('DisconnectForfeitService', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('forfeits a player who stays away for the whole grace period', async () => {
    const { presence, matches } = setup(['match-1', 'match-2']);
    presence.connect(ALICE);
    presence.disconnect(ALICE);
    await flush();

    await vi.advanceTimersByTimeAsync(GRACE_SECONDS * 1000 - 1);
    expect(matches.forfeitByDisconnect).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(matches.forfeitByDisconnect).toHaveBeenCalledWith(ALICE, 'match-1');
    expect(matches.forfeitByDisconnect).toHaveBeenCalledWith(ALICE, 'match-2');
  });

  it('lets the game go on if the player reconnects in time', async () => {
    const { presence, matches } = setup();
    presence.connect(ALICE);
    presence.disconnect(ALICE);
    await flush();

    await vi.advanceTimersByTimeAsync(10_000);
    presence.connect(ALICE); // a page refresh
    await vi.advanceTimersByTimeAsync(60_000);
    expect(matches.forfeitByDisconnect).not.toHaveBeenCalled();
  });

  it('does nothing while another tab is still open', async () => {
    const { presence, matches } = setup();
    presence.connect(ALICE);
    presence.connect(ALICE);
    presence.disconnect(ALICE); // one tab closed, one left
    await flush();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(matches.inProgressMatchIdsOf).not.toHaveBeenCalled();
    expect(matches.forfeitByDisconnect).not.toHaveBeenCalled();
  });

  it('starts no countdown for a player without a running match', async () => {
    const { presence, matches } = setup([]);
    presence.connect(ALICE);
    presence.disconnect(ALICE);
    await flush();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(matches.forfeitByDisconnect).not.toHaveBeenCalled();
  });

  it('survives a failing database call', async () => {
    const { presence, matches } = setup();
    matches.inProgressMatchIdsOf.mockRejectedValue(new Error('db down'));
    presence.connect(ALICE);
    presence.disconnect(ALICE);
    await flush();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(matches.forfeitByDisconnect).not.toHaveBeenCalled();
  });

  it('can forfeit again after a reconnection and a second disconnection', async () => {
    const { presence, matches } = setup();
    presence.connect(ALICE);
    presence.disconnect(ALICE);
    await flush();
    presence.connect(ALICE);
    presence.disconnect(ALICE);
    await flush();
    await vi.advanceTimersByTimeAsync(GRACE_SECONDS * 1000);
    expect(matches.forfeitByDisconnect).toHaveBeenCalledTimes(1);
  });
});
