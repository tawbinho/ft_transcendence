import { screen } from '@testing-library/react';
import { DEFAULT_BOARD_SETTINGS } from '@/features/game/settings';
import { expectNoA11yViolations } from '@/test/axe';
import { renderWithProviders } from '@/test/render';
import { OfflineGame } from './OfflineGame';
import type { Session } from './session';

// The computer's search runs in a Web Worker, which jsdom does not have. Tests decide its answers.
const bot = vi.hoisted(() => ({ chooseMove: vi.fn(), dispose: vi.fn() }));
vi.mock('@/features/game/bot', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/game/bot')>()),
  createBotClient: () => bot,
}));

const twoPeople: Session = {
  id: 1,
  settings: DEFAULT_BOARD_SETTINGS,
  opponent: { kind: 'human' },
  names: ['Ana', 'Ben'],
};
const computerFirst: Session = {
  ...twoPeople,
  opponent: { kind: 'computer', difficulty: 'easy', computerSeat: 1 },
};
const computerSecond: Session = {
  ...twoPeople,
  opponent: { kind: 'computer', difficulty: 'easy', computerSeat: 2 },
};

const liveRegion = (container: HTMLElement) => container.querySelector('[aria-live="polite"]');
const column = (n: number) => screen.getByRole('button', { name: `Drop a disc in column ${n}` });

beforeEach(() => {
  bot.chooseMove.mockReset();
  bot.dispose.mockReset();
});

describe('OfflineGame', () => {
  it('puts keyboard focus on the board as soon as the game starts', () => {
    renderWithProviders(<OfflineGame title="Same screen" session={twoPeople} onChangeSettings={() => {}} />);

    expect(column(4)).toHaveFocus();
  });

  it('plays a move from the keyboard and announces it', async () => {
    const { events, container } = renderWithProviders(
      <OfflineGame title="Same screen" session={twoPeople} onChangeSettings={() => {}} />,
    );
    expect(screen.getByText('Ana to play')).toBeInTheDocument();

    await events.keyboard('2');

    expect(screen.getByText('Ben to play')).toBeInTheDocument();
    expect(liveRegion(container)).toHaveTextContent('Ana played column 2.');
  });

  it('says how the game ended and after how many moves', async () => {
    const { events, container } = renderWithProviders(
      <OfflineGame title="Same screen" session={twoPeople} onChangeSettings={() => {}} />,
    );

    // Ana stacks column 1, Ben column 2.
    await events.keyboard('1212121');

    expect(screen.getByText('Ana wins!')).toBeInTheDocument();
    expect(screen.getByText('Connected 4 in 7 moves.')).toBeInTheDocument();
    expect(liveRegion(container)).toHaveTextContent('Ana played column 1. Ana wins!');
  });

  it('throws confetti on a win, and takes it away with a new game', async () => {
    const { events } = renderWithProviders(
      <OfflineGame title="Same screen" session={twoPeople} onChangeSettings={() => {}} />,
    );
    expect(screen.queryByTestId('celebration')).not.toBeInTheDocument();

    await events.keyboard('1212121');
    expect(screen.getByTestId('celebration')).toBeInTheDocument();

    await events.click(screen.getByRole('button', { name: 'Play again' }));
    expect(screen.queryByTestId('celebration')).not.toBeInTheDocument();
    // The new board takes the keyboard again.
    expect(column(4)).toHaveFocus();
  });

  it('shows no confetti for people who asked for less motion', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce'), media: query }));
    const { events } = renderWithProviders(
      <OfflineGame title="Same screen" session={twoPeople} onChangeSettings={() => {}} />,
    );

    await events.keyboard('1212121');

    expect(screen.getByText('Ana wins!')).toBeInTheDocument();
    expect(screen.queryByTestId('celebration')).not.toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('shows the computer thinking, and blocks the board meanwhile', () => {
    bot.chooseMove.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<OfflineGame title="Computer" session={computerFirst} onChangeSettings={() => {}} />);

    expect(screen.getByText('The computer is thinking')).toBeInTheDocument();
    expect(column(1)).toHaveAttribute('aria-disabled', 'true');
  });

  it('gives the turn back to you once the computer has played', async () => {
    bot.chooseMove.mockResolvedValue(3);
    const { container } = renderWithProviders(
      <OfflineGame title="Computer" session={computerFirst} onChangeSettings={() => {}} />,
    );

    expect(await screen.findByText('Your turn', undefined, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.queryByText('The computer is thinking')).not.toBeInTheDocument();
    expect(liveRegion(container)).toHaveTextContent('Computer played column 4.');
  });

  it('celebrates when you beat the computer', async () => {
    // The computer plays far from your column, so you stack four discs.
    bot.chooseMove.mockResolvedValue(6);
    const { events } = renderWithProviders(
      <OfflineGame title="Computer" session={computerSecond} onChangeSettings={() => {}} />,
    );

    for (let turn = 0; turn < 3; turn++) {
      await events.keyboard('1');
      await screen.findByText('Your turn', undefined, { timeout: 3000 });
    }
    await events.keyboard('1');

    expect(screen.getByText('You win!')).toBeInTheDocument();
    expect(screen.getByTestId('celebration')).toBeInTheDocument();
  }, 10_000);

  it('takes a move back and goes back to the setup form on request', async () => {
    const onChangeSettings = vi.fn();
    const { events } = renderWithProviders(
      <OfflineGame title="Same screen" session={twoPeople} onChangeSettings={onChangeSettings} />,
    );
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();

    await events.keyboard('4');
    await events.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByText('Ana to play')).toBeInTheDocument();

    await events.click(screen.getByRole('button', { name: 'Change settings' }));
    expect(onChangeSettings).toHaveBeenCalled();
  });

  it('has no accessibility problems', async () => {
    const { container } = renderWithProviders(
      <OfflineGame title="Same screen" session={twoPeople} onChangeSettings={() => {}} />,
    );
    await expectNoA11yViolations(container);
  });
});
