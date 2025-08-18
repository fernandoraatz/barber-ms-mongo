import { IsISO8601, IsMongoId } from 'class-validator';

export class RescheduleAppointmentDto {
  @IsISO8601()
  newStartAtISO: string;

  // opcionalmente permitir trocar de serviço durante remarcação
  @IsMongoId()
  serviceId: string;
}
