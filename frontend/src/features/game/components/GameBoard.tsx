import { Board, type BoardProps } from './Board';
import './boardStage.css';

/**
 * Every game screen draws its board through this component, so how boards are
 * drawn can change in one place. The board stands in a box (boardStage.css)
 * sized from the number of columns and rows.
 */
export function GameBoard(props: BoardProps) {
  return (
    <div
      className="board-stage"
      style={{ '--cols': props.model.cols, '--rows': props.model.rows } as React.CSSProperties}
    >
      <Board {...props} />
    </div>
  );
}
