import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProfessionalCategoryDocument = HydratedDocument<ProfessionalCategory>;

@Schema({ timestamps: true, collection: 'professional_categories' })
export class ProfessionalCategory {
  @Prop({ required: true, trim: true, unique: true })
  name: string;

  @Prop({ default: true, index: true })
  status: boolean; // true = ativa, false = inativa
}

export const ProfessionalCategorySchema = SchemaFactory.createForClass(ProfessionalCategory);

ProfessionalCategorySchema.index({ name: 'text' });
