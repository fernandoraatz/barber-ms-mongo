import { IsBoolean, IsOptional, IsPositive, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryCategoryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  status?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  limit?: number;
}
