import { IsBooleanString, IsIn, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class MonthAvailabilityDto {
  @Type(() => Number) @IsInt() year?: number; // default: atual
  @Type(() => Number) @IsInt() @IsIn([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) month?: number; // default: atual
  @IsOptional() @IsBooleanString() includeSlots?: 'true' | 'false';
}
