import { IsBoolean, IsIn, IsMongoId, IsOptional, Matches } from 'class-validator';

export class CreateScheduleSegmentDto {
  @IsMongoId()
  professionalId: string; // no endpoint "me" vamos ignorar esse campo

  @IsIn([0, 1, 2, 3, 4, 5, 6])
  weekday: number; // 0..6

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime: string; // "HH:mm"

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime: string; // "HH:mm"

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
