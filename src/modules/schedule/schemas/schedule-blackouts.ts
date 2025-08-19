import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ScheduleBlackoutDocument = HydratedDocument<ScheduleBlackout>;

/** Bloqueio pontual por data específica (ex.: 2025-08-20 10:00–12:00) */
@Schema({ timestamps: true, collection: 'schedule_blackouts' })
export class ScheduleBlackout {
  @Prop({ type: Types.ObjectId, ref: 'Professional', required: true, index: true })
  professionalId: Types.ObjectId;

  // Data local (YYYY-MM-DD no fuso -03) guardada como Date no UTC da meia-noite local
  @Prop({ type: Date, required: true, index: true })
  day: Date;

  @Prop({ required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ })
  startTime: string; // "HH:mm" local

  @Prop({ required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ })
  endTime: string;

  @Prop() reason?: string;
  @Prop() createdBy?: string; // opcional (userId do admin)
}

export const ScheduleBlackoutSchema = SchemaFactory.createForClass(ScheduleBlackout);
