import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Appointment, AppointmentSchema } from './schemas/appointment.schema';
import { AppointmentService } from './appointment.service';
import { AppointmentController } from './appointment.controller';
import { Service, ServiceSchema } from '../service/schemas/service.schema';
import { Professional, ProfessionalSchema } from '../professional/schemas/professional.schema';
import { ScheduleModule } from '../schedule/schedule.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
      { name: Service.name, schema: ServiceSchema },
      { name: Professional.name, schema: ProfessionalSchema },
    ]),
    ScheduleModule, // valida slots contra agenda
  ],
  controllers: [AppointmentController],
  providers: [AppointmentService],
  exports: [AppointmentService],
})
export class AppointmentModule {}
