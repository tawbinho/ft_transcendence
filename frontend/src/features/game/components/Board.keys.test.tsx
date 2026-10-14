import { screen } from '@testing-library/react';
import { createGame, replay } from '@/features/game/engine';
import { renderWithProviders } from '@/test/render';
import { Board } from './Board';

const empty = createGame({});
const model = { ...empty.settings, board: empty.board, lastMove: null, winningLine: null };

describe('Board keys', () => {
  it('drops a disc in the focused column with Enter or Space', async () => {
    const onPlay = vi.fn();
    const { events } = renderWithProviders(<Board model={model} theme="classic" onPlay={onPlay} autoFocus />);

    await events.keyboard('{ArrowRight}{Enter}');
    await events.keyboard('{Home}{ }');

    expect(onPlay).toHaveBeenNthCalledWith(1, 4);
    expect(onPlay).toHaveBeenNthCalledWith(2, 0);
  });

  it('has no number keys: a digit neither moves focus nor drops a disc', async () => {
    const onPlay = vi.fn();
    const { events } = renderWithProviders(<Board model={model} theme="classic" onPlay={onPlay} autoFocus />);

    await events.keyboard('5');

    expect(onPlay).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Drop a disc in column 4' })).toHaveFocus();
  });

  it('does nothing while the board is disabled', async () => {
    const onPlay = vi.fn();
    const { events } = renderWithProviders(<Board model={model} theme="classic" onPlay={onPlay} disabled autoFocus />);

    await events.keyboard('{Enter}');

    expect(onPlay).not.toHaveBeenCalled();
  });

  it('does not play into a full column', async () => {
    const full = replay({}, [3, 3, 3, 3, 3, 3]);
    const onPlay = vi.fn();
    const { events } = renderWithProviders(
      <Board
        model={{ ...full.settings, board: full.board, lastMove: null, winningLine: null }}
        theme="classic"
        onPlay={onPlay}
        autoFocus
      />,
    );

    await events.keyboard('{Enter}');

    expect(onPlay).not.toHaveBeenCalled();
  });
});
