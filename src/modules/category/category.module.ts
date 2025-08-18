import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { ProfessionalCategory, ProfessionalCategorySchema } from './schemas/category.schema';
import { Professional, ProfessionalSchema } from '../professional/schemas/professional.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProfessionalCategory.name, schema: ProfessionalCategorySchema },
      // para checar vínculo antes de excluir:
      { name: Professional.name, schema: ProfessionalSchema },
    ]),
  ],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}
