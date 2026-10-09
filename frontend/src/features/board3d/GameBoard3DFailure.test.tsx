import { screen, waitFor } from '@testing-library/react';
import { GameBoard } from '@/features/game/components/GameBoard';
import { createGame } from '@/features/game/engine';
import { allowConsole } from '@/test/console';
import { renderWithProviders } from '@/test/render';
import { resetWebGLStub, stubWebGL2 } from './webglStub';

// A 3D board that crashes while drawing. This file has its own copy of
// GameBoard's "3D failed" memory, which lasts for the rest of the visit.
vi.mock('./Board3DView', () => ({
  default: () => {
    throw new Error('WebGL context lost');
  },
}));

resetWebGLStub();

const empty = createGame({});
const model = { ...empty.settings, board: empty.board, lastMove: null, winningLine: null };

describe('GameBoard when the 3D board fails', () => {
  it('shows the 2D board again, hides the switch, and keeps it hidden on the next board', async () => {
    stubWebGL2();
    allowConsole(); // React reports the error it caught
    window.localStorage.setItem('board-view', '3d');
    const { events, unmount } = renderWithProviders(<GameBoard model={model} theme="classic" onPlay={() => {}} />);

    await waitFor(() => expect(screen.queryByRole('group', { name: 'Board view' })).not.toBeInTheDocument());
    expect(screen.getByRole('group', { name: 'Board with 7 columns and 6 rows' })).toBeInTheDocument();

    // A board drawn later starts in 2D, and the game can still be played.
    const onPlay = vi.fn();
    unmount();
    renderWithProviders(<GameBoard model={model} theme="classic" onPlay={onPlay} />);
    expect(screen.queryByRole('group', { name: 'Board view' })).not.toBeInTheDocument();
    await events.click(screen.getByRole('button', { name: 'Drop a disc in column 1' }));
    expect(onPlay).toHaveBeenCalledWith(0);
  });
});
