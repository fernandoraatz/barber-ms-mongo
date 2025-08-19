import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ScheduleSettingsDocument = HydratedDocument<ScheduleSettings>;

@Schema({ timestamps: true, collection: 'schedule_settings' })
export class ScheduleSettings {
  @Prop({ type: Types.ObjectId, ref: 'Professional', required: true, index: true, unique: true })
  professionalId: Types.ObjectId;

  // Horário padrão diário (aplica para seg–sáb)
  @Prop({ required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ })
  startTime: string; // ex: "09:00"

  @Prop({ required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ })
  endTime: string; // ex: "18:00"

  // Intervalos de pausa (almoço etc.)
  @Prop({
    type: [{ start: { type: String }, end: { type: String } }],
    default: [], // ex: [{start:"12:00", end:"13:00"}]
  })
  breaks: { start: string; end: string }[];

  // Dias ativos (0=dom ... 6=sáb). Default: 1..6 (seg–sáb)
  @Prop({ type: [Number], default: [1, 2, 3, 4, 5, 6] })
  workingDays: number[]; // domingo (0) não incluso por padrão
}

export const ScheduleSettingsSchema = SchemaFactory.createForClass(ScheduleSettings);
