import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BotService } from './bot.service.js';
import type { MatchesService } from './matches.service.js';

const HUMAN = 'user-human';
const BOT = 'user-bot-hard';

interface Fixture {
  status?: 'waiting' | 'in_progress' | 'finished';
  invitedUserId?: string | null;
  // columns already played
  moves?: number[];
  // seat of the bot: 1 or 2
  botSeat?: 1 | 2;
}

function setup(fixture: Fixture = {}) {
  const { status = 'in_progress', invitedUserId = null, moves = [], botSeat = 1 } = fixture;
  const match = { id: 'm1', status, invitedUserId, cols: 7, rows: 6, winLength: 4 };
  const humanSeat = botSeat === 1 ? 2 : 1;

  const matchRows = { findOneBy: vi.fn().mockResolvedValue(match), query: vi.fn().mockResolvedValue([]) };
  const playerRows = {
    find: vi.fn().mockResolvedValue([
      { seat: botSeat, userId: BOT },
      { seat: humanSeat, userId: HUMAN },
    ]),
    findOneBy: vi.fn().mockResolvedValue({ seat: botSeat, userId: BOT }),
  };
  const moveRows = {
    countBy: vi.fn().mockResolvedValue(moves.length),
    find: vi.fn().mockResolvedValue(moves.map((col, i) => ({ ply: i + 1, col }))),
  };
  const matchesService = {
    join: vi.fn().mockResolvedValue(undefined),
    makeMove: vi.fn().mockResolvedValue(undefined),
    onMatchChanged: vi.fn(),
  };
  const users = {
    ensureBot: vi.fn().mockImplementation((name: string) =>
      Promise.resolve({ id: name === 'AI_Hard' ? BOT : `id-${name}` }),
    ),
  };
  const ai = { choose: vi.fn().mockResolvedValue(3) };

  const service = new BotService(
    matchRows as never,
    playerRows as never,
    moveRows as never,
    matchesService as unknown as MatchesService,
    users as never,
    ai as never,
  );
  service.thinkDelayMs = () => 1000;
  return { service, match, matchesService, ai, matchRows };
}

describe('BotService', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('creates its three accounts and listens to match changes at startup', async () => {
    const { service, matchesService } = setup();
    await service.onModuleInit();
    expect(matchesService.onMatchChanged).toHaveBeenCalledTimes(1);
  });

  it('joins a waiting match that was reserved for it', async () => {
    const { service, matchesService } = setup({ status: 'waiting', invitedUserId: BOT });
    await service.onModuleInit();
    await service.handle('m1');
    expect(matchesService.join).toHaveBeenCalledWith(BOT, 'm1');
  });

  it('ignores a waiting match reserved for someone else, or for nobody', async () => {
    for (const invitedUserId of [HUMAN, null]) {
      const { service, matchesService } = setup({ status: 'waiting', invitedUserId });
      await service.onModuleInit();
      await service.handle('m1');
      expect(matchesService.join).not.toHaveBeenCalled();
    }
  });

  it('plays after a delay when it is its turn (seat 1, no move yet)', async () => {
    const { service, matchesService, ai } = setup({ botSeat: 1, moves: [] });
    await service.onModuleInit();
    await service.handle('m1');
    expect(matchesService.makeMove).not.toHaveBeenCalled(); // it "thinks" first
    await vi.advanceTimersByTimeAsync(1000);
    expect(ai.choose).toHaveBeenCalledTimes(1);
    expect(ai.choose.mock.calls[0]![1]).toBe('hard');
    expect(matchesService.makeMove).toHaveBeenCalledWith(BOT, 'm1', 3);
  });

  it('answers the human: seat 2 moves after one move was played', async () => {
    const { service, matchesService } = setup({ botSeat: 2, moves: [3] });
    await service.onModuleInit();
    await service.handle('m1');
    await vi.advanceTimersByTimeAsync(1000);
    expect(matchesService.makeMove).toHaveBeenCalledTimes(1);
  });

  it('gives the AI the real position of the match', async () => {
    const { service, ai } = setup({ botSeat: 2, moves: [3] });
    await service.onModuleInit();
    await service.handle('m1');
    await vi.advanceTimersByTimeAsync(1000);
    const state = ai.choose.mock.calls[0]![0];
    expect(state.moveCount).toBe(1);
    expect(state.current).toBe(2);
    expect(state.board[3][0]).toBe(1);
  });

  it('waits when it is the human\'s turn', async () => {
    const { service, matchesService } = setup({ botSeat: 1, moves: [3] }); // seat 2 (human) to move
    await service.onModuleInit();
    await service.handle('m1');
    await vi.advanceTimersByTimeAsync(5000);
    expect(matchesService.makeMove).not.toHaveBeenCalled();
  });

  it('plans one move even when several events arrive', async () => {
    const { service, matchesService } = setup({ botSeat: 1, moves: [] });
    await service.onModuleInit();
    await Promise.all([service.handle('m1'), service.handle('m1'), service.handle('m1')]);
    await vi.advanceTimersByTimeAsync(5000);
    expect(matchesService.makeMove).toHaveBeenCalledTimes(1);
  });

  it('does nothing for a finished match', async () => {
    const { service, matchesService } = setup({ status: 'finished' });
    await service.onModuleInit();
    await service.handle('m1');
    await vi.advanceTimersByTimeAsync(5000);
    expect(matchesService.makeMove).not.toHaveBeenCalled();
  });

  it('does not play if the match ended during its delay (the human resigned)', async () => {
    const { service, matchesService, match } = setup({ botSeat: 1 });
    await service.onModuleInit();
    await service.handle('m1');
    match.status = 'finished';
    await vi.advanceTimersByTimeAsync(1000);
    expect(matchesService.makeMove).not.toHaveBeenCalled();
  });

  it('survives a failing move and can plan again afterwards', async () => {
    const { service, matchesService } = setup({ botSeat: 1 });
    matchesService.makeMove.mockRejectedValueOnce(new Error('NOT_YOUR_TURN'));
    await service.onModuleInit();
    await service.handle('m1');
    await vi.advanceTimersByTimeAsync(1000);
    await service.handle('m1'); // the plan was released
    await vi.advanceTimersByTimeAsync(1000);
    expect(matchesService.makeMove).toHaveBeenCalledTimes(2);
  });
});
