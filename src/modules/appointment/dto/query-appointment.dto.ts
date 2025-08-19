import { IsISO8601, IsOptional, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryMyAppointmentsDto {
  @IsOptional() @IsISO8601() from?: string;
  @IsOptional() @IsISO8601() to?: string;
  @IsOptional() @Type(() => Number) @IsPositive() page?: number;
  @IsOptional() @Type(() => Number) @IsPositive() limit?: number;
}
