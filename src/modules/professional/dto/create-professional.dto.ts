import { IsArray, IsEnum, IsMongoId, IsOptional, IsString, ArrayUnique } from 'class-validator';
import { ProfessionalStatus } from '../schemas/professional.schema';

export class CreateProfessionalDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  photo?: string;

  @IsEnum(ProfessionalStatus)
  @IsOptional()
  status?: ProfessionalStatus;

  @IsMongoId()
  categoryId: string;

  @IsArray()
  @ArrayUnique()
  @IsMongoId({ each: true })
  serviceIds: string[];
}
