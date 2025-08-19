import { IsMongoId, IsOptional, IsString, Matches } from 'class-validator';

export class CreateAppointmentDto {
  @IsMongoId()
  professionalId: string;

  @IsMongoId()
  serviceId: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string; // "YYYY-MM-DD" (America/Sao_Paulo)

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  time: string; // "HH:mm" (America/Sao_Paulo)

  @IsOptional()
  @IsString()
  notes?: string;
}
