import { screen } from '@testing-library/react';
import { GameBoard } from '@/features/game/components/GameBoard';
import { createGame } from '@/features/game/engine';
import { renderWithProviders } from '@/test/render';
import { resetWebGLStub, stubWebGL2 } from './webglStub';

// A build made with VITE_BOARD_3D=off. This runs before the imports, because
// GameBoard reads the setting once, when it is loaded.
vi.hoisted(() => vi.stubEnv('VITE_BOARD_3D', 'off'));

resetWebGLStub();

const empty = createGame({});
const model = { ...empty.settings, board: empty.board, lastMove: null, winningLine: null };

describe('GameBoard built with VITE_BOARD_3D=off', () => {
  it('has no switch even in a browser with WebGL 2', () => {
    stubWebGL2();
    renderWithProviders(<GameBoard model={model} theme="classic" />);

    expect(screen.getByRole('img', { name: 'Board with 7 columns and 6 rows' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Board view' })).not.toBeInTheDocument();
  });
});
