import { IsISO8601, IsMongoId, IsOptional, IsString } from 'class-validator';

export class CreateAppointmentDto {
  @IsMongoId()
  professionalId: string;

  @IsMongoId()
  serviceId: string;

  // Ex.: "2025-08-18T15:00:00-03:00" (recomendado já com TZ do cliente)
  @IsISO8601()
  startAtISO: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
