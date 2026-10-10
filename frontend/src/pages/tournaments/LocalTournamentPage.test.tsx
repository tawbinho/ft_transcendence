import { screen, within } from '@testing-library/react';
import { DEFAULT_BOARD_SETTINGS } from '@/features/game/settings';
import { createLocalTournament, saveLocalTournament } from '@/features/tournaments/local';
import { expectNoA11yViolations } from '@/test/axe';
import { renderRoute } from '@/test/render';

type Events = ReturnType<typeof renderRoute>['events'];

async function fillNames(events: Events, names: string[]) {
  for (const [index, name] of names.entries()) {
    await events.type(await screen.findByRole('textbox', { name: `Name of player ${index + 1}` }), name);
  }
}

/** Plays the next match to its end; the first player of the pairing stacks column 1 and wins. Returns the winner. */
async function playNextMatch(events: Events): Promise<string> {
  await events.click(await screen.findByRole('button', { name: 'Play this match' }));
  const title = (await screen.findByRole('heading', { level: 1 })).textContent ?? '';
  const [winner] = title.split(' vs ');
  for (const column of [1, 2, 1, 2, 1, 2, 1]) {
    await events.click(screen.getByRole('button', { name: `Drop a disc in column ${column}` }));
  }
  await events.click(screen.getByRole('button', { name: 'Continue' }));
  return winner!;
}

describe('same-screen tournament', () => {
  it('asks for names first and says which are missing', async () => {
    const { events, container } = renderRoute('/tournaments/local', { user: null });
    await events.click(await screen.findByRole('button', { name: 'Draw the bracket' }));

    expect(screen.getAllByText('This field is required.')).toHaveLength(4);
    expect(screen.queryByRole('heading', { name: 'Bracket' })).not.toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('refuses a name used twice', async () => {
    const { events } = renderRoute('/tournaments/local', { user: null });
    await fillNames(events, ['Ana', 'ana', 'Cleo', 'Dan']);
    await events.click(screen.getByRole('button', { name: 'Draw the bracket' }));

    expect(screen.getByText('Each player needs a different name.')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Name of player 2' })).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByRole('heading', { name: 'Bracket' })).not.toBeInTheDocument();
  });

  it('adds and removes players between 3 and 8', async () => {
    const { events } = renderRoute('/tournaments/local', { user: null });
    await events.click(await screen.findByRole('button', { name: 'Remove player 4' }));
    expect(screen.queryByRole('textbox', { name: 'Name of player 4' })).not.toBeInTheDocument();
    // At 3 players there is nothing left to remove.
    expect(screen.queryByRole('button', { name: /Remove player/ })).not.toBeInTheDocument();

    for (let i = 0; i < 5; i++) await events.click(screen.getByRole('button', { name: 'Add a player' }));
    expect(screen.getAllByRole('textbox')).toHaveLength(8);
    expect(screen.queryByRole('button', { name: 'Add a player' })).not.toBeInTheDocument();
  });

  it('names the player a remove button removes once they have a name', async () => {
    const { events } = renderRoute('/tournaments/local', { user: null });
    await events.type(await screen.findByRole('textbox', { name: 'Name of player 4' }), 'Dan');

    await events.click(screen.getByRole('button', { name: 'Remove Dan' }));
    expect(screen.queryByRole('textbox', { name: 'Name of player 4' })).not.toBeInTheDocument();
  });

  it('plays from the setup form to a champion', async () => {
    const { events, container } = renderRoute('/tournaments/local', { user: null });
    await events.click(await screen.findByRole('button', { name: 'Remove player 4' }));
    await fillNames(events, ['Ana', 'Ben', 'Cleo']);
    await events.click(screen.getByRole('button', { name: 'Draw the bracket' }));

    // Three players: one bye, so two matches.
    expect(await screen.findByText('0 of 2 matches played')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Bracket' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Semi-finals' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Final' })).toBeInTheDocument();
    await expectNoA11yViolations(container);

    await playNextMatch(events);
    expect(await screen.findByText('1 of 2 matches played')).toBeInTheDocument();
    const winner = await playNextMatch(events);

    const banner = await screen.findByRole('heading', { level: 2, name: `${winner} wins the tournament!` });
    expect(banner).toBeInTheDocument();
    expect(screen.getByText('2 of 2 matches played')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Play this match' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Same players, new draw' })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('puts the keyboard on the board when a match starts and passes axe', async () => {
    saveLocalTournament(createLocalTournament(['Ana', 'Ben', 'Cleo', 'Dan'], DEFAULT_BOARD_SETTINGS, () => 0));
    const { events, container } = renderRoute('/tournaments/local', { user: null });
    await events.click(await screen.findByRole('button', { name: 'Resume your tournament' }));
    await events.click(await screen.findByRole('button', { name: 'Play this match' }));

    const board = await screen.findByRole('group', { name: /Board with 7 columns/ });
    expect(board.contains(document.activeElement)).toBe(true);
    await expectNoA11yViolations(container);
  });

  it('can go back to the bracket from an unfinished match', async () => {
    saveLocalTournament(createLocalTournament(['Ana', 'Ben', 'Cleo', 'Dan'], DEFAULT_BOARD_SETTINGS, () => 0));
    const { events } = renderRoute('/tournaments/local', { user: null });
    await events.click(await screen.findByRole('button', { name: 'Resume your tournament' }));
    await events.click(await screen.findByRole('button', { name: 'Play this match' }));
    await events.click(await screen.findByRole('button', { name: 'Back to the bracket' }));

    expect(await screen.findByRole('button', { name: 'Play this match' })).toBeInTheDocument();
  });
});

describe('a same-screen tournament left unfinished', () => {
  const save = () =>
    saveLocalTournament(createLocalTournament(['Ana', 'Ben', 'Cleo', 'Dan'], DEFAULT_BOARD_SETTINGS, () => 0));

  it('is offered back after a reload, with its progress', async () => {
    save();
    const { container } = renderRoute('/tournaments/local', { user: null });

    expect(await screen.findByRole('heading', { level: 1, name: 'Resume your tournament?' })).toBeInTheDocument();
    expect(screen.getByText(/Ana, Ben, Cleo, Dan/)).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: '0 of 3 matches played' })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('comes back to its bracket when the player resumes', async () => {
    save();
    const { events } = renderRoute('/tournaments/local', { user: null });
    await events.click(await screen.findByRole('button', { name: 'Resume your tournament' }));

    const bracket = await screen.findByRole('group', { name: 'Bracket' });
    expect(within(bracket).getAllByText('Ana').length).toBeGreaterThan(0);
  });

  it('is cleared when the player starts a new one', async () => {
    save();
    const { events } = renderRoute('/tournaments/local', { user: null });
    await events.click(await screen.findByRole('button', { name: 'Start a new one' }));

    expect(await screen.findByRole('button', { name: 'Draw the bracket' })).toBeInTheDocument();
    expect(window.localStorage.getItem('local-tournament')).toBeNull();
  });

  it('shows on the hub as a tournament to continue', async () => {
    save();
    renderRoute('/tournaments', { user: null });
    expect(await screen.findByRole('link', { name: 'Continue the tournament' })).toHaveAttribute(
      'href',
      '/tournaments/local',
    );
  });
});
