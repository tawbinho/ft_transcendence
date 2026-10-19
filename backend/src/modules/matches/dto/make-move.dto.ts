import { IsInt, Max, Min } from 'class-validator';

// WHY THIS FILE EXISTS
// The body of a move. Only the SHAPE is checked here (a whole number in a
// sane range); whether that column exists on THIS board, whether it is full,
// and whose turn it is are decided by the engine and the service.
export class MakeMoveDto {
  @IsInt()
  @Min(0)
  @Max(11)
  col: number;
}
