import { Module } from '@nestjs/common';
import { AuthModule, UserModule, ProfessionalModule } from './modules';
import { MongooseModule } from '@nestjs/mongoose';
import { ServiceModule } from './modules/service/service.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.DATABASE_URL ?? 'mongodb://localhost:27017/barbershop'),
    AuthModule,
    UserModule,
    ProfessionalModule,
    ServiceModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
