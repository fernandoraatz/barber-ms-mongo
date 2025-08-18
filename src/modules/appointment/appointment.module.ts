import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Appointment, AppointmentSchema } from './schemas/appointment.schema';
import { AppointmentService } from './appointment.service';
import { AppointmentController } from './appointment.controller';
import { Professional, ProfessionalSchema } from '../professional/schemas/professional.schema';
import { Service, ServiceSchema } from '../service/schemas/service.schema';
import {
  ProfessionalSchedule,
  ProfessionalScheduleSchema,
} from '../professional-schedule/schemas/professional-schedule.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
      { name: Professional.name, schema: ProfessionalSchema },
      { name: Service.name, schema: ServiceSchema },
      { name: ProfessionalSchedule.name, schema: ProfessionalScheduleSchema },
    ]),
  ],
  controllers: [AppointmentController],
  providers: [AppointmentService],
  exports: [AppointmentService],
})
export class AppointmentModule {}
