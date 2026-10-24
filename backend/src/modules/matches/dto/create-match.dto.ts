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

// The rules for the body of POST /matches, enforced by the global
// ValidationPipe before the controller runs.
export class MatchSettingsDto {
  @IsOptional()
  @IsInt()
  @Min(SETTINGS_API_LIMITS.cols.min)
  @Max(SETTINGS_API_LIMITS.cols.max)
  cols?: number;

  @IsOptional()
  @IsInt()
  @Min(SETTINGS_API_LIMITS.rows.min)
  @Max(SETTINGS_API_LIMITS.rows.max)
  rows?: number;

  @IsOptional()
  @IsInt()
  @Min(SETTINGS_API_LIMITS.winLength.min)
  @Max(SETTINGS_API_LIMITS.winLength.max)
  winLength?: number;

  @IsOptional()
  @IsIn([...MATCH_THEMES])
  theme?: string;
}

export class CreateMatchDto {
  @IsOptional()
  // Validates the nested object with MatchSettingsDto's rules too.
  @ValidateNested()
  @Type(() => MatchSettingsDto)
  settings?: MatchSettingsDto;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(3, 20)
  opponentDisplayName?: string;
}
