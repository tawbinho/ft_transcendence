import { DEFAULT_BOARD_SETTINGS } from '@/features/game/settings';
import { saveLastSettings } from '@/features/game/lastSettings';
import { buildSession, startingValues, type SetupValues } from './session';

const values: SetupValues = {
  settings: DEFAULT_BOARD_SETTINGS,
  difficulty: 'hard',
  firstPlayer: 'you',
  names: ['  Ana ', ''],
};

describe('buildSession', () => {
  it('builds a same-screen game with trimmed names', () => {
    const session = buildSession('local', values);

    expect(session.opponent).toEqual({ kind: 'human' });
    expect(session.names).toEqual(['Ana', '']);
  });

  it('puts the computer second when you start', () => {
    expect(buildSession('computer', values).opponent).toEqual({
      kind: 'computer',
      difficulty: 'hard',
      computerSeat: 2,
    });
  });

  it('puts the computer first when it starts', () => {
    const session = buildSession('computer', { ...values, firstPlayer: 'computer' });
    expect(session.opponent).toMatchObject({ computerSeat: 1 });
  });

  it('lets chance decide when the first player is random', () => {
    const random = { ...values, firstPlayer: 'random' as const };
    expect(buildSession('computer', random, () => 0.2).opponent).toMatchObject({ computerSeat: 1 });
    expect(buildSession('computer', random, () => 0.8).opponent).toMatchObject({ computerSeat: 2 });
  });
});

describe('startingValues', () => {
  beforeEach(() => localStorage.clear());

  it('starts from the classic board when nothing was played yet', () => {
    expect(startingValues().settings).toEqual(DEFAULT_BOARD_SETTINGS);
  });

  it('starts from the board of the last game', () => {
    saveLastSettings({ cols: 9, rows: 7, winLength: 5, theme: 'sunset' });

    expect(startingValues()).toMatchObject({
      settings: { cols: 9, rows: 7, winLength: 5, theme: 'sunset' },
      difficulty: 'medium',
      firstPlayer: 'you',
    });
  });
});
