import { screen } from '@testing-library/react';
import { createGame } from '@/features/game/engine';
import { renderWithProviders } from '@/test/render';
import Board3DView from './Board3DView';

// Board3D is replaced by a box that shows the props the view gave it.
const received = vi.fn();
vi.mock('./Board3D', () => ({
  Board3D: (props: Record<string, unknown>) => {
    received(props);
    return <div data-testid="board3d" />;
  },
}));

const empty = createGame({});
const model = { ...empty.settings, board: empty.board, lastMove: null, winningLine: null };

describe('Board3DView', () => {
  beforeEach(() => received.mockClear());

  it('hands the 2D board props to the 3D board under the names it expects', () => {
    const onPlay = vi.fn();
    renderWithProviders(<Board3DView model={model} theme="ocean" onPlay={onPlay} previewSeat={2} disabled autoFocus />);

    expect(screen.getByTestId('board3d')).toBeInTheDocument();
    const props = received.mock.calls[0]?.[0];
    expect(props.onDrop).toBe(onPlay);
    expect(props.theme).toBe('ocean');
    expect(props.disabled).toBe(true);
    expect(props.autoFocus).toBe(true);
    expect(props.game).toEqual({ board: model.board, current: 2, lastMove: null, winningLine: null });
  });

  it('gives the board a 4:3 box that stays on screen', () => {
    renderWithProviders(<Board3DView model={model} theme="classic" />);

    const { className } = received.mock.calls[0]?.[0];
    expect(className).toContain('aspect-[4/3]');
    expect(className).toContain('max-h-[70vh]');
  });

  it('describes how to play when the board can be played', () => {
    renderWithProviders(<Board3DView model={model} theme="classic" onPlay={() => {}} />);

    const props = received.mock.calls[0]?.[0];
    expect(props.label).toBe(
      'Board in 3D with 7 columns and 6 rows. Use the left and right arrow keys to choose a column and Enter to drop a disc.',
    );
    expect(props.describeColumn(2)).toBe('Column 3');
  });

  it('only describes the board when it is a picture', () => {
    renderWithProviders(<Board3DView model={model} theme="classic" />);

    expect(received.mock.calls[0]?.[0].label).toBe('Board in 3D with 7 columns and 6 rows');
  });
});
