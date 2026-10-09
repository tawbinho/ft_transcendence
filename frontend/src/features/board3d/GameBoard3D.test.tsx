import { screen } from '@testing-library/react';
import { GameBoard } from '@/features/game/components/GameBoard';
import { createGame } from '@/features/game/engine';
import { expectNoA11yViolations } from '@/test/axe';
import { renderWithProviders } from '@/test/render';
import { resetWebGLStub, stubWebGL2 } from './webglStub';

// The real 3D board needs a GPU; this stands in for it.
vi.mock('./Board3DView', () => ({ default: () => <div>The 3D board</div> }));

resetWebGLStub();

const empty = createGame({});
const model = { ...empty.settings, board: empty.board, lastMove: null, winningLine: null };
const board2D = () => screen.queryByRole('img', { name: 'Board with 7 columns and 6 rows' });

describe('GameBoard with the 3D board built in', () => {
  it('shows only the 2D board, with no switch, in a browser without WebGL 2', () => {
    renderWithProviders(<GameBoard model={model} theme="classic" />);

    expect(board2D()).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Board view' })).not.toBeInTheDocument();
  });

  describe('in a browser with WebGL 2', () => {
    beforeEach(stubWebGL2);

    it('offers a 2D / 3D switch above the 2D board', async () => {
      const { container } = renderWithProviders(<GameBoard model={model} theme="classic" />);

      expect(screen.getByRole('group', { name: 'Board view' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '2D' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: '3D' })).toHaveAttribute('aria-pressed', 'false');
      expect(board2D()).toBeInTheDocument();
      await expectNoA11yViolations(container);
    });

    it('switches to the 3D board and back, and remembers the choice', async () => {
      const { events } = renderWithProviders(<GameBoard model={model} theme="classic" />);

      await events.click(screen.getByRole('button', { name: '3D' }));
      expect(await screen.findByText('The 3D board')).toBeInTheDocument();
      expect(board2D()).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: '3D' })).toHaveAttribute('aria-pressed', 'true');
      expect(window.localStorage.getItem('board-view')).toBe('3d');

      await events.click(screen.getByRole('button', { name: '2D' }));
      expect(board2D()).toBeInTheDocument();
      expect(window.localStorage.getItem('board-view')).toBe('2d');
    });

    it('opens in 3D when the last visit ended in 3D', async () => {
      window.localStorage.setItem('board-view', '3d');
      renderWithProviders(<GameBoard model={model} theme="classic" />);

      expect(await screen.findByText('The 3D board')).toBeInTheDocument();
    });

    it('stays in 2D and hides the switch when WebGL 2 cannot actually be started', async () => {
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
      const { events } = renderWithProviders(<GameBoard model={model} theme="classic" />);

      await events.click(screen.getByRole('button', { name: '3D' }));

      expect(screen.queryByRole('group', { name: 'Board view' })).not.toBeInTheDocument();
      expect(board2D()).toBeInTheDocument();
      expect(window.localStorage.getItem('board-view')).toBeNull();
    });

    it('does not start WebGL just to show the switch', () => {
      const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext');
      renderWithProviders(<GameBoard model={model} theme="classic" />);

      expect(getContext).not.toHaveBeenCalled();
    });

    it('ignores a saved value it does not know', () => {
      window.localStorage.setItem('board-view', 'hologram');
      renderWithProviders(<GameBoard model={model} theme="classic" />);

      expect(board2D()).toBeInTheDocument();
    });
  });
});
