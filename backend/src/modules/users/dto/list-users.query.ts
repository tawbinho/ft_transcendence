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
const toBoolean = ({ value }: { value: unknown }): unknown =>
  value === 'true' ? true : value === 'false' ? false : value;

// The query string of GET /users (the Players page): a text search, two
// filters, a sort and pagination.
export class ListUsersQuery {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(50)
  search?: string;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  online?: boolean;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  friends?: boolean;

  @IsOptional()
  @IsIn([...USER_SORTS])
  sort?: UserSort;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
