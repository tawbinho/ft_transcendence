import { Board, type BoardProps } from './Board';

/**
 * Every game screen draws its board through this component, so how boards are
 * drawn (for example a 2D or 3D view) can change in one place.
 */
export function GameBoard(props: BoardProps) {
  return <Board {...props} />;
}
