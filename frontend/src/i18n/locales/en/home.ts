export const homeMessages = {
  home: {
    title: 'Four in a row. Endless ways to play.',
    subtitle:
      'Drop discs, connect four before your opponent does, and pick your battle: a friend on the same screen, the computer, or a player online.',
    playNow: 'Play now',
    createAccount: 'Create an account',
    modesTitle: 'Ways to play',
    local: { title: 'Same screen', body: 'Two players take turns on one device. No account needed.' },
    computer: { title: 'Against the computer', body: 'Three levels, from relaxed to ruthless. Sign up to play.' },
    online: { title: 'Online', body: 'Create a match, send the link, and play a friend from anywhere.' },
    customTitle: 'Your board, your rules',
    customBody: 'Choose from 5 to 10 columns and 5 to 9 rows, connect 3, 4 or 5, and pick a color theme.',
    onlineGuestTitle: 'Sign up to play online',
    points: {
      title: 'And there is more',
      tournaments: { title: 'Tournaments', body: 'Create an online knockout bracket, or join one.' },
      community: {
        title: 'Friends and chat',
        body: 'Add friends, chat with them and challenge them to a match.',
      },
    },
    greeting: {
      morning: 'Good morning, {{name}}',
      afternoon: 'Good afternoon, {{name}}',
      evening: 'Good evening, {{name}}',
    },
    dashboardSubtitle: 'Pick up where you left off.',
    quick: {
      title: 'Start a game',
      online: 'New online match',
      computer: 'Against the computer',
      local: 'Same screen',
      tournaments: 'Tournaments',
    },
    yourTurn: {
      title: 'Your turn',
      all: 'All matches',
      empty: 'No match is waiting for your move.',
      others: 'Matches in progress: {{count}}.',
      versus: 'Against {{name}}',
      move: 'Your move',
    },
    recent: { title: 'Recent results', all: 'All matches', empty: 'Your finished matches will appear here.' },
    friendsOnline: {
      title: 'Friends online',
      all: 'All friends',
      empty: 'None of your friends is online right now.',
      noFriends: 'Add friends to see when they are online.',
      challenge: 'Challenge',
      challengeName: 'Challenge {{name}}',
    },
  },
};

export type HomeMessages = typeof homeMessages;
