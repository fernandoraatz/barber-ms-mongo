import { IsDateString, IsMongoId, IsOptional, IsString, Matches } from 'class-validator';

export class CreateBlackoutDto {
  @IsMongoId() professionalId: string;
  @IsDateString() dayISO: string; // "YYYY-MM-DD" recomendado
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) startTime: string;
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) endTime: string;

  @IsOptional() @IsString() reason?: string;
}
