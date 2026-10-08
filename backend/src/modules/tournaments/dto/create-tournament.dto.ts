import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { MatchSettingsDto } from '../../matches/dto/create-match.dto.js';
import {
  TOURNAMENT_NAME_PATTERN,
  TOURNAMENT_SIZES,
} from '../tournament.constants.js';

// WHY THIS FILE EXISTS
// The rules for the body of POST /tournaments, enforced by the global
// ValidationPipe before the controller runs. This is what the "new tournament"
// form sends: a name, how many places, and optionally the board. Anything
// else in the body is rejected.
export class CreateTournamentDto {
  @ApiProperty({
    example: 'Friday cup',
    description:
      "3 to 30 characters: letters, digits, spaces and - _ ' . , starting with a letter or a digit",
  })
  // Runs before the validation: "  Friday cup " becomes "Friday cup".
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Matches(TOURNAMENT_NAME_PATTERN, {
    message:
      "name must be 3 to 30 characters: letters, digits, spaces and - _ ' . , starting with a letter or a digit",
  })
  name: string;

  @ApiProperty({
    enum: TOURNAMENT_SIZES,
    example: 4,
    description: 'Number of places',
  })
  @IsIn([...TOURNAMENT_SIZES])
  size: number;

  @ApiPropertyOptional({
    type: MatchSettingsDto,
    description:
      'The board of every match of the tournament. Omit for the classic 7x6, four in a row.',
  })
  @IsOptional()
  // Validates the nested object with MatchSettingsDto's rules too (the same
  // object a match is created with).
  @ValidateNested()
  @Type(() => MatchSettingsDto)
  settings?: MatchSettingsDto;
}
