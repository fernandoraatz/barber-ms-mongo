import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ProfessionalSchedule,
  ProfessionalScheduleSchema,
} from './schemas/professional-schedule.schema';
import { ProfessionalScheduleService } from './professional-schedule.service';
import { ProfessionalScheduleController } from './professional-schedule.controller';
import { ProfessionalModule } from '../professional/professional.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProfessionalSchedule.name, schema: ProfessionalScheduleSchema },
    ]),
    ProfessionalModule, // para descobrir "meu" professionalId
  ],
  providers: [ProfessionalScheduleService],
  controllers: [ProfessionalScheduleController],
  exports: [ProfessionalScheduleService],
})
export class ProfessionalScheduleModule {}
