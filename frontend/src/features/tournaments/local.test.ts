import { DEFAULT_BOARD_SETTINGS } from '@/features/game/settings';
import { championOf, nextPairing } from './bracket';
import {
  createLocalTournament,
  loadLocalTournament,
  recordLocalResult,
  saveLocalTournament,
  validateAliases,
} from './local';

describe('validateAliases', () => {
  it('accepts distinct names and flags empty, long and repeated ones', () => {
    expect(validateAliases(['Ana', 'Ben', 'Chloé'])).toEqual([null, null, null]);
    expect(validateAliases(['Ana', '  ', 'x'.repeat(21), 'ana '])).toEqual([
      null,
      'validation.required',
      'validation.aliasLength',
      'validation.aliasTaken',
    ]);
  });
});

describe('createLocalTournament', () => {
  it('refuses fewer than 3 or more than 8 players', () => {
    expect(() => createLocalTournament(['a', 'b'], DEFAULT_BOARD_SETTINGS)).toThrow();
    expect(() => createLocalTournament('abcdefghi'.split(''), DEFAULT_BOARD_SETTINGS)).toThrow();
  });

  it('draws a bracket with every player once and gives the bye to the first pairing', () => {
    const tournament = createLocalTournament([' Ana ', 'Ben', 'Chloé'], DEFAULT_BOARD_SETTINGS, () => 0);
    expect(tournament.players).toEqual(['Ana', 'Ben', 'Chloé']);
    const first = tournament.bracket[0]!;
    expect(
      first
        .flatMap((pairing) => pairing.players)
        .filter(Boolean)
        .sort(),
    ).toEqual(['Ana', 'Ben', 'Chloé']);
    expect(first[0]!.bye).toBe(true);
    // The player with the bye already waits in the final.
    expect(tournament.bracket[1]![0]!.players.filter(Boolean)).toHaveLength(1);
  });

  it('plays through to a champion', () => {
    let tournament = createLocalTournament(['Ana', 'Ben', 'Chloé', 'Dan'], DEFAULT_BOARD_SETTINGS);
    for (let next = nextPairing(tournament.bracket); next; next = nextPairing(tournament.bracket)) {
      tournament = recordLocalResult(tournament, next.round, next.index, 0);
    }
    expect(tournament.players).toContain(championOf(tournament.bracket));
  });
});

describe('saving', () => {
  it('reads back what was saved, and forgets it', () => {
    const tournament = createLocalTournament(['Ana', 'Ben', 'Chloé'], DEFAULT_BOARD_SETTINGS);
    saveLocalTournament(tournament);
    expect(loadLocalTournament()).toEqual(tournament);
    saveLocalTournament(null);
    expect(loadLocalTournament()).toBeNull();
  });

  it('ignores anything that is not a saved tournament', () => {
    localStorage.setItem('local-tournament', '{"version":2}');
    expect(loadLocalTournament()).toBeNull();
    localStorage.setItem('local-tournament', 'not json');
    expect(loadLocalTournament()).toBeNull();
  });
});
