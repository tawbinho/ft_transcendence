import { IsInt, Max, Min } from 'class-validator';

// The body of a move.
export class MakeMoveDto {
  @IsInt()
  @Min(0)
  @Max(11)
  col: number;
}
