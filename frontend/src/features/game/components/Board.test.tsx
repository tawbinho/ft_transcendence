import { screen } from '@testing-library/react';
import { createGame, replay } from '@/features/game/engine';
import { expectNoA11yViolations } from '@/test/axe';
import { renderWithProviders } from '@/test/render';
import { GameBoard } from './GameBoard';
import { GameLayout } from './GameLayout';
import { MoveAnnouncer } from './MoveAnnouncer';

const empty = createGame({});
const model = { ...empty.settings, board: empty.board, lastMove: null, winningLine: null };

describe('GameBoard', () => {
  it('draws a playable board: one button per column, in an accessible group', async () => {
    const onPlay = vi.fn();
    const { container, events } = renderWithProviders(<GameBoard model={model} theme="classic" onPlay={onPlay} />);

    expect(screen.getByRole('group', { name: 'Board with 7 columns and 6 rows' })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(7);

    await events.click(screen.getByRole('button', { name: 'Drop a disc in column 4' }));
    expect(onPlay).toHaveBeenCalledWith(3);
    await expectNoA11yViolations(container);
  });

  it('is only a picture without onPlay', () => {
    renderWithProviders(<GameBoard model={model} theme="classic" />);

    expect(screen.getByRole('img', { name: 'Board with 7 columns and 6 rows' })).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('ignores clicks while disabled', async () => {
    const onPlay = vi.fn();
    const { events } = renderWithProviders(<GameBoard model={model} theme="classic" onPlay={onPlay} disabled />);

    await events.click(screen.getByRole('button', { name: 'Drop a disc in column 1' }));

    expect(onPlay).not.toHaveBeenCalled();
  });

  it('says when a column is full', () => {
    // Column 0 filled with alternating discs: no four in a row.
    const full = replay({}, [0, 0, 0, 0, 0, 0]);
    renderWithProviders(
      <GameBoard
        model={{ ...full.settings, board: full.board, lastMove: null, winningLine: null }}
        theme="classic"
        onPlay={() => {}}
      />,
    );

    expect(screen.getByRole('button', { name: 'Column 1 is full' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('does not take focus unless asked to', () => {
    renderWithProviders(<GameBoard model={model} theme="classic" onPlay={() => {}} />);
    expect(document.body).toHaveFocus();
  });

  it('takes keyboard focus on the middle column when it appears with autoFocus', () => {
    renderWithProviders(<GameBoard model={model} theme="classic" onPlay={() => {}} autoFocus />);
    expect(screen.getByRole('button', { name: 'Drop a disc in column 4' })).toHaveFocus();
  });

  it('moves focus between columns with the arrow keys', async () => {
    const { events } = renderWithProviders(<GameBoard model={model} theme="classic" onPlay={() => {}} autoFocus />);

    await events.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Drop a disc in column 5' })).toHaveFocus();

    await events.keyboard('{Home}');
    expect(screen.getByRole('button', { name: 'Drop a disc in column 1' })).toHaveFocus();

    await events.keyboard('{End}');
    expect(screen.getByRole('button', { name: 'Drop a disc in column 7' })).toHaveFocus();
  });
});

describe('GameLayout', () => {
  it('puts the board column and the side panel next to each other', () => {
    renderWithProviders(<GameLayout aside={<p>Rules</p>}>Board column</GameLayout>);

    expect(screen.getByText('Board column')).toBeInTheDocument();
    expect(screen.getByRole('complementary')).toHaveTextContent('Rules');
  });
});

describe('MoveAnnouncer', () => {
  it('is a polite live region that is not shown on screen', () => {
    const { container } = renderWithProviders(<MoveAnnouncer text="alice played column 4." />);

    const region = container.querySelector('[aria-live="polite"]');
    expect(region).toHaveTextContent('alice played column 4.');
    expect(region).toHaveClass('sr-only');
  });
});
