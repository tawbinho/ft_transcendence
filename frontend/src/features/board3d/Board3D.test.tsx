import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Board3D } from './Board3D';
import { resetWebGLStub, stubWebGL2 } from './webglStub';

// The canvas needs a real GPU; what is tested here is the keyboard and labels around it.
vi.mock('@react-three/fiber', () => ({ Canvas: () => <canvas data-testid="canvas" /> }));

resetWebGLStub();

const empty = Array.from({ length: 7 }, () => Array<number>(6).fill(0));
// Column 0 is full.
const withFullColumn = empty.map((column, col) => (col === 0 ? [1, 2, 1, 2, 1, 2] : column));

describe('Board3D', () => {
  beforeEach(stubWebGL2);

  it('drops a disc with the arrow keys and Enter, starting from the middle column', async () => {
    const onDrop = vi.fn();
    render(
      <Board3D
        game={{ board: empty }}
        onDrop={onDrop}
        label="3D board"
        describeColumn={(col) => `Column ${col + 1}`}
      />,
    );
    const board = screen.getByRole('application', { name: '3D board' });
    const events = userEvent.setup();

    board.focus();
    await events.keyboard('{ArrowRight}');
    expect(screen.getByText('Column 4')).toBeInTheDocument(); // the first arrow key chooses the middle column
    await events.keyboard('{ArrowRight}');
    expect(screen.getByText('Column 5')).toBeInTheDocument();
    await events.keyboard('{Enter}');
    expect(onDrop).toHaveBeenCalledWith(4);

    await events.keyboard('{Home}{ }');
    expect(onDrop).toHaveBeenLastCalledWith(0);
  });

  it('has no number keys: a digit neither chooses a column nor drops a disc', async () => {
    const onDrop = vi.fn();
    render(<Board3D game={{ board: empty }} onDrop={onDrop} label="3D board" />);
    const events = userEvent.setup();

    screen.getByRole('application').focus();
    await events.keyboard('3');
    await events.keyboard('{Enter}'); // nothing is chosen yet, so Enter drops nothing either
    expect(onDrop).not.toHaveBeenCalled();
  });

  it('does nothing while disabled or when the column is full', async () => {
    const onDrop = vi.fn();
    const { rerender } = render(<Board3D game={{ board: withFullColumn }} onDrop={onDrop} />);
    const events = userEvent.setup();

    screen.getByRole('application').focus();
    await events.keyboard('{Home}{Enter}');
    expect(onDrop).not.toHaveBeenCalled();

    rerender(<Board3D game={{ board: empty }} onDrop={onDrop} disabled />);
    await events.keyboard('{ArrowRight}{Enter}');
    expect(onDrop).not.toHaveBeenCalled();
  });

  it('is only a picture without onDrop', () => {
    render(<Board3D game={{ board: empty }} label="3D board" />);

    expect(screen.getByRole('img', { name: '3D board' })).not.toHaveAttribute('tabindex');
  });

  it('takes focus once when it appears if asked to', () => {
    render(<Board3D game={{ board: empty }} onDrop={() => {}} autoFocus />);

    expect(screen.getByRole('application')).toHaveFocus();
  });

  it('shows the fallback instead of crashing when the browser has no WebGL 2', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    act(() => {});
    render(<Board3D game={{ board: empty }} fallback="No WebGL" />);

    expect(screen.getByText('No WebGL')).toBeInTheDocument();
    expect(screen.queryByTestId('canvas')).not.toBeInTheDocument();
  });
});
