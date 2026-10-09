import { describe, expect, it, vi } from 'vitest';
import type { MatchesService } from '../matches/matches.service.js';
import { TurnTimeoutService } from './turn-timeout.service.js';

function setup(rows: Array<{ match_id: string; user_id: string }>) {
  const pairings = { query: vi.fn().mockResolvedValue(rows) };
  const matches = { forfeitByDisconnect: vi.fn().mockResolvedValue(true) };
  const config = { get: vi.fn().mockReturnValue(180) };
  const service = new TurnTimeoutService(
    pairings as never,
    matches as unknown as MatchesService,
    config as never,
  );
  return { service, pairings, matches };
}

describe('TurnTimeoutService.sweep', () => {
  it('forfeits the player to move in every stalled match', async () => {
    const { service, matches, pairings } = setup([
      { match_id: 'm1', user_id: 'u1' },
      { match_id: 'm2', user_id: 'u2' },
    ]);
    expect(await service.sweep()).toBe(2);
    expect(matches.forfeitByDisconnect).toHaveBeenCalledWith('u1', 'm1');
    expect(matches.forfeitByDisconnect).toHaveBeenCalledWith('u2', 'm2');
    // the configured timeout is what the query receives
    expect(pairings.query.mock.calls[0]![1]).toEqual([180]);
  });

  it('does nothing when no match is stalled', async () => {
    const { service, matches } = setup([]);
    expect(await service.sweep()).toBe(0);
    expect(matches.forfeitByDisconnect).not.toHaveBeenCalled();
  });

  it('does not count a match that ended meanwhile', async () => {
    const { service, matches } = setup([{ match_id: 'm1', user_id: 'u1' }]);
    matches.forfeitByDisconnect.mockResolvedValue(false);
    expect(await service.sweep()).toBe(0);
  });

  it('keeps going when one forfeit fails', async () => {
    const { service, matches } = setup([
      { match_id: 'm1', user_id: 'u1' },
      { match_id: 'm2', user_id: 'u2' },
    ]);
    matches.forfeitByDisconnect.mockRejectedValueOnce(new Error('boom'));
    expect(await service.sweep()).toBe(1);
    expect(matches.forfeitByDisconnect).toHaveBeenCalledTimes(2);
  });

  it('survives a failing query', async () => {
    const { service, pairings } = setup([]);
    pairings.query.mockRejectedValue(new Error('db down'));
    expect(await service.sweep()).toBe(0);
  });

  it('never runs two sweeps at once', async () => {
    const { service, pairings } = setup([]);
    let release!: () => void;
    pairings.query.mockReturnValue(new Promise((resolve) => (release = () => resolve([]))));
    const first = service.sweep();
    expect(await service.sweep()).toBe(0); // skipped: the first is still running
    expect(pairings.query).toHaveBeenCalledTimes(1);
    release();
    await first;
  });
});
