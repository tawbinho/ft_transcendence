import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { MATCH_THEMES, SETTINGS_API_LIMITS } from '../match.constants.js';

// WHY THIS FILE EXISTS
// The rules for the body of POST /matches, enforced by the global
// ValidationPipe before the controller runs. Anything missing falls back to
// the classic game (7 x 6, four in a row, classic theme) in the service.
// Whether the win length fits the board (it must not be longer than the
// smaller side) is checked by the engine, not here.
export class MatchSettingsDto {
  @ApiPropertyOptional({
    example: 7,
    minimum: SETTINGS_API_LIMITS.cols.min,
    maximum: SETTINGS_API_LIMITS.cols.max,
    description: 'Number of columns',
  })
  @IsOptional()
  @IsInt()
  @Min(SETTINGS_API_LIMITS.cols.min)
  @Max(SETTINGS_API_LIMITS.cols.max)
  cols?: number;

  @ApiPropertyOptional({
    example: 6,
    minimum: SETTINGS_API_LIMITS.rows.min,
    maximum: SETTINGS_API_LIMITS.rows.max,
    description: 'Number of rows',
  })
  @IsOptional()
  @IsInt()
  @Min(SETTINGS_API_LIMITS.rows.min)
  @Max(SETTINGS_API_LIMITS.rows.max)
  rows?: number;

  @ApiPropertyOptional({
    example: 4,
    minimum: SETTINGS_API_LIMITS.winLength.min,
    maximum: SETTINGS_API_LIMITS.winLength.max,
    description:
      'Discs in a row needed to win (at most the smaller board side)',
  })
  @IsOptional()
  @IsInt()
  @Min(SETTINGS_API_LIMITS.winLength.min)
  @Max(SETTINGS_API_LIMITS.winLength.max)
  winLength?: number;

  @ApiPropertyOptional({ enum: MATCH_THEMES, example: 'classic' })
  @IsOptional()
  @IsIn([...MATCH_THEMES])
  theme?: string;
}

export class CreateMatchDto {
  @ApiPropertyOptional({
    type: MatchSettingsDto,
    description:
      'Board settings. Omit for the classic 7x6, four-in-a-row game.',
  })
  @IsOptional()
  // Validates the nested object with MatchSettingsDto's rules too.
  @ValidateNested()
  @Type(() => MatchSettingsDto)
  settings?: MatchSettingsDto;

  @ApiPropertyOptional({
    example: 'friend',
    description:
      'Invite one specific player by display name. Only they can join. Omit for an open match.',
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(3, 20)
  opponentDisplayName?: string;
}
