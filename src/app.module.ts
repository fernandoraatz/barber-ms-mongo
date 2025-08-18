import { Module } from '@nestjs/common';
import { AuthModule, UserModule, ProfessionalModule } from './modules';
import { MongooseModule } from '@nestjs/mongoose';
import { ServiceModule } from './modules/service/service.module';
import { CategoryModule } from './modules/category/category.module';
import { ProfessionalScheduleModule } from './modules/professional-schedule/professional-schedule.module';
import { AppointmentModule } from './modules/appointment/appointment.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.DATABASE_URL ?? 'mongodb://localhost:27017/barbershop'),
    AuthModule,
    UserModule,
    ProfessionalModule,
    ServiceModule,
    CategoryModule,
    ProfessionalScheduleModule,
    AppointmentModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
