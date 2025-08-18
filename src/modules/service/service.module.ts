import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Service, ServiceSchema } from './schemas/service.schema';
import { ServiceService } from './service.service';
import { ServiceController } from './service.controller';
import { Professional, ProfessionalSchema } from '../professional/schemas/professional.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Service.name, schema: ServiceSchema },
      // Para checar vínculos antes de excluir:
      { name: Professional.name, schema: ProfessionalSchema },
    ]),
  ],
  providers: [ServiceService],
  controllers: [ServiceController],
  exports: [ServiceService],
})
export class ServiceModule {}
