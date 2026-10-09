import i18n from '@/i18n';
import { replay, type GameState } from '@/features/game/engine';
import {
  moveAnnouncement,
  resultDetail,
  resultText,
  seatName,
  statusText,
  statusTone,
  type Players,
} from './offlineText';

const t = i18n.getFixedT('en');

const twoPeople: Players = { computerSeat: null, names: ['', ''] };
const named: Players = { computerSeat: null, names: ['Ana', 'Ben'] };
const computerSecond: Players = { computerSeat: 2, names: ['', ''] };

// Seat 1 stacks column 0, seat 2 column 1: seat 1 connects four on its fourth disc.
const seatOneWins = replay({}, [0, 1, 0, 1, 0, 1, 0]);
const midGame = replay({}, [3, 3]);
// A draw cannot be reached quickly, so the finished state is built by hand.
const drawn: GameState = { ...replay({}, [3]), status: 'draw', moveCount: 42 };

describe('seatName', () => {
  it('uses Player 1 and Player 2 when no names were typed', () => {
    expect(seatName(1, twoPeople, t)).toBe('Player 1');
    expect(seatName(2, twoPeople, t)).toBe('Player 2');
  });

  it('uses the typed names', () => {
    expect(seatName(1, named, t)).toBe('Ana');
    expect(seatName(2, named, t)).toBe('Ben');
  });

  it('calls the person "You" and the other seat "Computer"', () => {
    expect(seatName(1, computerSecond, t)).toBe('You');
    expect(seatName(2, computerSecond, t)).toBe('Computer');
  });
});

describe('resultText', () => {
  it('is null while the game goes on', () => {
    expect(resultText(midGame, twoPeople, t)).toBeNull();
  });

  it('names the winner between two people', () => {
    expect(resultText(seatOneWins, named, t)).toBe('Ana wins!');
  });

  it('says "You win!" or "You lose." against the computer', () => {
    expect(resultText(seatOneWins, computerSecond, t)).toBe('You win!');
    expect(resultText(seatOneWins, { computerSeat: 1, names: ['', ''] }, t)).toBe('You lose.');
  });

  it('says it is a draw', () => {
    expect(resultText(drawn, twoPeople, t)).toBe('Draw: the board is full.');
  });
});

describe('resultDetail', () => {
  it('says how many discs were lined up and after how many moves', () => {
    expect(resultDetail(seatOneWins, t)).toBe('Connected 4 in 7 moves.');
  });

  it('says after how many moves a draw happened', () => {
    expect(resultDetail(drawn, t)).toBe('The board filled up after 42 moves.');
  });

  it('is null while the game goes on', () => {
    expect(resultDetail(midGame, t)).toBeNull();
  });
});

describe('statusText', () => {
  it('says whose turn it is between two people', () => {
    expect(statusText(midGame, named, false, t)).toBe('Ana to play');
  });

  it('says "Your turn" against the computer', () => {
    expect(statusText(midGame, computerSecond, false, t)).toBe('Your turn');
  });

  it('says the computer is thinking', () => {
    expect(statusText(midGame, computerSecond, true, t)).toBe('The computer is thinking');
  });

  it('shows the result once the game is over, even if the computer was thinking', () => {
    expect(statusText(seatOneWins, named, true, t)).toBe('Ana wins!');
  });
});

describe('statusTone', () => {
  it('has no color while playing', () => {
    expect(statusTone(midGame, null)).toBe('none');
  });

  it('is green when you beat the computer and red when it beats you', () => {
    expect(statusTone(seatOneWins, 2)).toBe('win');
    expect(statusTone(seatOneWins, 1)).toBe('loss');
  });

  it('is neutral for a win between two people and for a draw', () => {
    expect(statusTone(seatOneWins, null)).toBe('over');
    expect(statusTone(drawn, 2)).toBe('over');
  });
});

describe('moveAnnouncement', () => {
  it('says nothing before the first move', () => {
    expect(moveAnnouncement(replay({}, []), 0, twoPeople, t)).toBe('');
  });

  it('says who played which column (columns count from 1)', () => {
    expect(moveAnnouncement(replay({}, [3]), 1, named, t)).toBe('Ana played column 4.');
    expect(moveAnnouncement(midGame, 2, named, t)).toBe('Ben played column 4.');
  });

  it('adds the result when the move ended the game', () => {
    expect(moveAnnouncement(seatOneWins, 7, named, t)).toBe('Ana played column 1. Ana wins!');
  });
});
