import { IsEnum, IsMongoId, IsOptional, IsPositive, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ProfessionalStatus } from '../schemas/professional.schema';

export class QueryProfessionalDto {
  @IsOptional()
  @IsMongoId()
  categoryId?: string;

  @IsOptional()
  @IsEnum(ProfessionalStatus)
  status?: ProfessionalStatus;

  @IsOptional()
  @IsString()
  q?: string; // busca por nome/descrição

  @Type(() => Number)
  @IsOptional()
  @IsPositive()
  page?: number;

  @Type(() => Number)
  @IsOptional()
  @IsPositive()
  limit?: number;
}
