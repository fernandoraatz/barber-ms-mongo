import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ServiceDocument = HydratedDocument<Service>;

@Schema({ timestamps: true, collection: 'services' })
export class Service {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ default: true, index: true })
  status: boolean; // true = ativo, false = inativo

  @Prop({ required: false, min: 1 })
  durationInMinutes?: number; // opcional
}

export const ServiceSchema = SchemaFactory.createForClass(Service);

// índices úteis
ServiceSchema.index({ name: 'text', description: 'text' });
