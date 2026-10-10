import { screen } from '@testing-library/react';
import { saveLastSettings } from '@/features/game/lastSettings';
import { readStorage } from '@/lib/storage';
import { expectNoA11yViolations } from '@/test/axe';
import { renderWithProviders } from '@/test/render';
import { OfflineSetup } from './OfflineSetup';

beforeEach(() => localStorage.clear());

describe('OfflineSetup', () => {
  it('asks for the two names when two people play', () => {
    renderWithProviders(<OfflineSetup mode="local" title="Same screen" onStart={() => {}} />);

    expect(screen.getByRole('textbox', { name: /Name of player 1/ })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Name of player 2/ })).toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: /Easy/ })).not.toBeInTheDocument();
  });

  it('asks for the level and who starts when playing the computer', () => {
    renderWithProviders(<OfflineSetup mode="computer" title="Computer" onStart={() => {}} />);

    expect(screen.getByRole('radio', { name: /Medium/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'You' })).toBeChecked();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('starts from the board of the last game', () => {
    saveLastSettings({ cols: 9, rows: 8, winLength: 5, theme: 'ocean' });
    renderWithProviders(<OfflineSetup mode="local" title="Same screen" onStart={() => {}} />);

    expect(screen.getByRole('slider', { name: 'Columns' })).toHaveValue('9');
    expect(screen.getByRole('slider', { name: 'Rows' })).toHaveValue('8');
    expect(screen.getByRole('slider', { name: 'Discs to connect' })).toHaveValue('5');
    expect(screen.getByRole('radio', { name: /Ocean/ })).toBeChecked();
  });

  it('hands the game to the page and remembers the board for next time', async () => {
    const onStart = vi.fn();
    const { events } = renderWithProviders(<OfflineSetup mode="local" title="Same screen" onStart={onStart} />);

    await events.type(screen.getByRole('textbox', { name: /Name of player 1/ }), 'Ana');
    await events.click(screen.getByRole('radio', { name: /Sunset/ }));
    await events.click(screen.getByRole('button', { name: 'Start game' }));

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart.mock.calls[0]![0]).toMatchObject({
      opponent: { kind: 'human' },
      names: ['Ana', ''],
      settings: { cols: 7, rows: 6, winLength: 4, theme: 'sunset' },
    });
    expect(JSON.parse(readStorage('board-settings') ?? '{}')).toMatchObject({ theme: 'sunset' });
  });

  it('starts a game against the computer with the chosen level', async () => {
    const onStart = vi.fn();
    const { events } = renderWithProviders(<OfflineSetup mode="computer" title="Computer" onStart={onStart} />);

    await events.click(screen.getByRole('radio', { name: /Hard/ }));
    await events.click(screen.getByRole('radio', { name: 'Computer' }));
    await events.click(screen.getByRole('button', { name: 'Start game' }));

    expect(onStart.mock.calls[0]![0].opponent).toEqual({ kind: 'computer', difficulty: 'hard', computerSeat: 1 });
  });

  it('has no accessibility problems', async () => {
    const { container } = renderWithProviders(<OfflineSetup mode="computer" title="Computer" onStart={() => {}} />);
    await expectNoA11yViolations(container);
  });
});
