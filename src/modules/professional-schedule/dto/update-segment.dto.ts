import { PartialType } from '@nestjs/mapped-types';
import { CreateScheduleSegmentDto } from './create-segment.dto';

export class UpdateScheduleSegmentDto extends PartialType(CreateScheduleSegmentDto) {}
