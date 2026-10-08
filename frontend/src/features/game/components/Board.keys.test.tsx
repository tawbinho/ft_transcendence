import { screen } from '@testing-library/react';
import { createGame, replay } from '@/features/game/engine';
import { renderWithProviders } from '@/test/render';
import { Board } from './Board';

const empty = createGame({});
const model = { ...empty.settings, board: empty.board, lastMove: null, winningLine: null };

describe('Board number keys', () => {
  it('drops a disc in the column of the digit pressed', async () => {
    const onPlay = vi.fn();
    const { events } = renderWithProviders(<Board model={model} theme="classic" onPlay={onPlay} autoFocus />);

    await events.keyboard('5');

    expect(onPlay).toHaveBeenCalledWith(4);
    expect(screen.getByRole('button', { name: 'Drop a disc in column 5' })).toHaveFocus();
  });

  it('ignores a digit beyond the last column', async () => {
    const onPlay = vi.fn();
    const { events } = renderWithProviders(<Board model={model} theme="classic" onPlay={onPlay} autoFocus />);

    await events.keyboard('9');

    expect(onPlay).not.toHaveBeenCalled();
  });

  it('does nothing while the board is disabled', async () => {
    const onPlay = vi.fn();
    const { events } = renderWithProviders(<Board model={model} theme="classic" onPlay={onPlay} disabled autoFocus />);

    await events.keyboard('3');

    expect(onPlay).not.toHaveBeenCalled();
  });

  it('does not play into a full column', async () => {
    const full = replay({}, [0, 0, 0, 0, 0, 0]);
    const onPlay = vi.fn();
    const { events } = renderWithProviders(
      <Board
        model={{ ...full.settings, board: full.board, lastMove: null, winningLine: null }}
        theme="classic"
        onPlay={onPlay}
        autoFocus
      />,
    );

    await events.keyboard('1');

    expect(onPlay).not.toHaveBeenCalled();
  });

  it('leaves browser shortcuts alone (Ctrl+1 switches tabs)', async () => {
    const onPlay = vi.fn();
    const { events } = renderWithProviders(<Board model={model} theme="classic" onPlay={onPlay} autoFocus />);

    await events.keyboard('{Control>}1{/Control}');

    expect(onPlay).not.toHaveBeenCalled();
  });
});
