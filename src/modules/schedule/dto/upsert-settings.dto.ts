import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsOptional,
  Matches,
} from 'class-validator';

export class UpsertSettingsDto {
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) startTime: string;
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) endTime: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  breaks?: { start: string; end: string }[]; // valide no service

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @ArrayUnique()
  @IsIn([0, 1, 2, 3, 4, 5, 6], { each: true })
  workingDays?: number[]; // default no service: [1..6]
}
