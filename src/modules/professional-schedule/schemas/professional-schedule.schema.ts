import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProfessionalScheduleDocument = HydratedDocument<ProfessionalSchedule>;

/**
 * weekday: 0 (domingo) ... 6 (sábado)
 * startTime/endTime: "HH:mm"
 */
@Schema({ timestamps: true, collection: 'professional_schedule' })
export class ProfessionalSchedule {
  @Prop({ type: Types.ObjectId, ref: 'Professional', required: true, index: true })
  professionalId: Types.ObjectId;

  @Prop({ required: true, min: 0, max: 6, index: true })
  weekday: number;

  @Prop({ required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ })
  startTime: string;

  @Prop({ required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ })
  endTime: string;

  @Prop({ default: true })
  active: boolean;
}

export const ProfessionalScheduleSchema = SchemaFactory.createForClass(ProfessionalSchedule);

// Índices úteis
ProfessionalScheduleSchema.index({ professionalId: 1, weekday: 1 });
ProfessionalScheduleSchema.index({ professionalId: 1, weekday: 1, startTime: 1 }, { unique: true });
