import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Professional, ProfessionalSchema } from './schemas/professional.schema';
import { ProfessionalService } from './professional.service';
import { ProfessionalController } from './professional.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Professional.name, schema: ProfessionalSchema }])],
  providers: [ProfessionalService],
  controllers: [ProfessionalController],
  exports: [ProfessionalService],
})
export class ProfessionalModule {}
