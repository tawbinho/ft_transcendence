import { describe, expect, it } from 'vitest';
import { isComputerPlayer, withoutComputerPlayers } from './computerPlayers';

describe('isComputerPlayer', () => {
  it('trusts the isBot flag', () => {
    expect(isComputerPlayer({ displayName: 'anything', isBot: true })).toBe(true);
    expect(isComputerPlayer({ displayName: 'AI_Hard', isBot: false })).toBe(true);
  });

  it('knows the three computer opponents by name where only a name is sent', () => {
    for (const displayName of ['AI_Easy', 'AI_Medium', 'AI_Hard']) {
      expect(isComputerPlayer({ displayName })).toBe(true);
    }
  });

  it('keeps real players whose name only starts with AI_', () => {
    for (const displayName of ['AI_Fan', 'AI_Qfur0i', 'AI_', 'AI_Easy2', 'xAI_Easy', 'ai_easy']) {
      expect(isComputerPlayer({ displayName, isBot: false })).toBe(false);
      expect(isComputerPlayer({ displayName })).toBe(false);
    }
  });
});

describe('withoutComputerPlayers', () => {
  it('removes only the computer opponents', () => {
    const users = [
      { displayName: 'AI_Easy' },
      { displayName: 'AI_Fan' },
      { displayName: 'mia', isBot: true },
      { displayName: 'zoe' },
    ];
    expect(withoutComputerPlayers(users).map((user) => user.displayName)).toEqual(['AI_Fan', 'zoe']);
  });
});
