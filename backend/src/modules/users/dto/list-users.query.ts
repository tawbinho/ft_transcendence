import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { USER_SORTS, type UserSort } from '../user.constants.js';

// Query strings arrive as text: "true" is the string "true", not a boolean.
// This turns "true"/"false" into booleans before they are checked, and leaves
// anything else alone so the validator can reject it.
const toBoolean = ({ value }: { value: unknown }): unknown =>
  value === 'true' ? true : value === 'false' ? false : value;

// WHY THIS FILE EXISTS
// The query string of GET /users (the Players page): a text search, two
// filters, a sort and pagination.
export class ListUsersQuery {
  @ApiPropertyOptional({
    example: 'mar',
    description: 'Part of a display name, case-insensitive',
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(50)
  search?: string;

  @ApiPropertyOptional({ description: 'Only players online now' })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  online?: boolean;

  @ApiPropertyOptional({ description: "Only the viewer's friends" })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  friends?: boolean;

  @ApiPropertyOptional({ enum: USER_SORTS, default: 'name' })
  @IsOptional()
  @IsIn([...USER_SORTS])
  sort?: UserSort;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 50, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiPropertyOptional({ example: 0, minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
