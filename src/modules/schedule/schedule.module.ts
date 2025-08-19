import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';
import { ScheduleSettings, ScheduleSettingsSchema } from './schemas/schedule-settings';
import { ScheduleBlackout, ScheduleBlackoutSchema } from './schemas/schedule-blackouts';
import { Appointment, AppointmentSchema } from '../appointment/schemas/appointment.schema';
import { ProfessionalModule } from '../professional/professional.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ScheduleSettings.name, schema: ScheduleSettingsSchema },
      { name: ScheduleBlackout.name, schema: ScheduleBlackoutSchema },
      { name: Appointment.name, schema: AppointmentSchema },
    ]),
    ProfessionalModule, // para rotas "me"
  ],
  providers: [ScheduleService],
  controllers: [ScheduleController],
  exports: [ScheduleService],
})
export class ScheduleModule {}
