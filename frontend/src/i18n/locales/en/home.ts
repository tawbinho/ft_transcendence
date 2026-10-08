export const homeMessages = {
  home: {
    title: 'Four in a row. Endless ways to play.',
    subtitle:
      'Drop discs, connect four before your opponent does, and pick your battle: a friend on the same screen, the computer, or a player online.',
    playNow: 'Play now',
    createAccount: 'Create an account',
    modesTitle: 'Ways to play',
    local: { title: 'Same screen', body: 'Two players take turns on one device. No account needed.' },
    computer: { title: 'Against the computer', body: 'Three levels, from relaxed to ruthless. No account needed.' },
    online: { title: 'Online', body: 'Create a match, send the link, and play a friend from anywhere.' },
    customTitle: 'Your board, your rules',
    customBody: 'Choose from 5 to 10 columns and 5 to 9 rows, connect 3, 4 or 5, and pick a color theme.',
  },
};

export type HomeMessages = typeof homeMessages;
