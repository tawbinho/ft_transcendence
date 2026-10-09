import { makeFinishedMatch } from '@/test/fixtures/matches';
import { makeMatch } from '@/test/factories';
import {
  liveAnnouncement,
  liveBanner,
  replayAnnouncement,
  replayBanner,
  resultText,
  seatName,
  type Translate,
} from './spectatorTexts';

// A translate function that shows the key and the values, so the tests read what is asked for.
const t = ((key: string, values?: object) =>
  values ? `${key} ${JSON.stringify(values)}` : key) as unknown as Translate;

const resigned = makeFinishedMatch({
  endReason: 'resign',
  winnerSeat: 2,
  players: [
    { seat: 1, userId: 'u1', displayName: 'alice', result: 'loss' },
    { seat: 2, userId: 'u2', displayName: 'bob', result: 'win' },
  ],
});

describe('seatName', () => {
  it('gives the name of the player in a seat', () => {
    expect(seatName(makeMatch(), 2)).toBe('bob');
  });

  it('gives a question mark for an empty seat', () => {
    expect(seatName({ players: [] }, 1)).toBe('?');
  });
});

describe('resultText', () => {
  it('names the winner', () => {
    expect(resultText(makeFinishedMatch(), t).status).toBe('game.wins {"name":"alice"}');
  });

  it('says it was a draw when nobody won', () => {
    const draw = makeFinishedMatch({ winnerSeat: null, endReason: 'draw' });
    expect(resultText(draw, t)).toEqual({ status: 'game.draw', detail: null });
  });

  it('says a match was cancelled', () => {
    const cancelled = makeFinishedMatch({ status: 'abandoned', winnerSeat: null, endReason: null });
    expect(resultText(cancelled, t).status).toBe('online.resultCancelled');
  });

  it('tells who gave up', () => {
    expect(resultText(resigned, t).detail).toBe('online.byResignation {"name":"alice"}');
  });

  it('tells who left the match', () => {
    const left = { ...resigned, endReason: 'disconnect' as const };
    expect(resultText(left, t).detail).toBe('online.byDisconnect {"name":"alice"}');
  });
});

describe('live banner', () => {
  it('says whose turn it is', () => {
    const match = makeMatch({}, [3, 3, 2]);
    expect(liveBanner(match, t)).toEqual({ tone: 'none', status: 'game.turnOf {"name":"bob"}', detail: null });
  });

  it('announces the last disc dropped', () => {
    const match = makeMatch({}, [3, 3, 2]);
    expect(liveAnnouncement(match, t)).toBe('game.playedColumn {"name":"alice","n":3}');
  });

  it('announces nothing before the first move', () => {
    expect(liveAnnouncement(makeMatch(), t)).toBe('');
  });
});

describe('replay banner', () => {
  const match = makeFinishedMatch();

  it('says the match has not started at step 0', () => {
    expect(replayBanner(match, 0, 7, t).status).toBe('watch.replay.start');
  });

  it('says which move was just played in the middle of the match', () => {
    const banner = replayBanner(match, 4, 7, t);
    expect(banner.status).toBe('game.playedColumn {"name":"bob","n":2}');
    expect(banner.tone).toBe('none');
  });

  it('gives the result on the last move, green for a player who won', () => {
    const banner = replayBanner(match, 7, 7, t);
    expect(banner.status).toBe('game.wins {"name":"alice"}');
    expect(banner.tone).toBe('win');
  });

  it('is red for a player who lost and grey for a spectator', () => {
    expect(replayBanner(resigned, 7, 7, t).tone).toBe('loss');
    expect(replayBanner({ ...match, yourSeat: null }, 7, 7, t).tone).toBe('over');
  });

  it('only gives the result for a match without moves', () => {
    const cancelled = makeFinishedMatch({ status: 'abandoned', winnerSeat: null, endReason: null });
    expect(replayBanner(cancelled, 0, 0, t).status).toBe('online.resultCancelled');
  });
});

describe('replay announcement', () => {
  const match = makeFinishedMatch();

  it('reads the move that was played', () => {
    expect(replayAnnouncement(match, 2, 7, t)).toBe('watch.replay.played {"step":2,"total":7,"name":"bob","col":2}');
  });

  it('adds the result on the last move', () => {
    expect(replayAnnouncement(match, 7, 7, t)).toContain('game.wins {"name":"alice"}');
  });

  it('says the match starts at step 0', () => {
    expect(replayAnnouncement(match, 0, 7, t)).toBe('watch.replay.start');
  });
});
