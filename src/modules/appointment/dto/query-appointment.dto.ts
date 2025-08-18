import { IsISO8601, IsIn, IsMongoId, IsOptional, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { AppointmentStatus } from '../schemas/appointment.schema';

export class QueryAppointmentsDto {
  @IsOptional() @IsMongoId() professionalId?: string;
  @IsOptional() @IsMongoId() userId?: string;

  @IsOptional() @IsISO8601() from?: string;
  @IsOptional() @IsISO8601() to?: string;

  @IsOptional() @IsIn(Object.values(AppointmentStatus)) status?: AppointmentStatus;

  @IsOptional() @Type(() => Number) @IsPositive() page?: number;
  @IsOptional() @Type(() => Number) @IsPositive() limit?: number;
}
