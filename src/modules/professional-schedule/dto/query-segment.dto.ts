import { IsDateString, IsIn, IsOptional, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class QuerySlotsDto {
  @IsDateString()
  date: string; // "YYYY-MM-DD" ou ISO completo

  @Type(() => Number)
  @IsOptional()
  @IsPositive()
  slotMinutes?: number; // padrão 60

  @IsOptional()
  @IsIn(['true', 'false'])
  skipPast?: 'true' | 'false'; // se "true" e a data for hoje, remove slots já passados
}
