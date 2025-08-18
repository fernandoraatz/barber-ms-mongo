import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AppointmentDocument = HydratedDocument<Appointment>;

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
}

@Schema({ timestamps: true, collection: 'appointments' })
export class Appointment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId; // cliente

  @Prop({ type: Types.ObjectId, ref: 'Professional', required: true, index: true })
  professionalId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Service', required: true })
  serviceId: Types.ObjectId;

  @Prop({ type: Date, required: true, index: true })
  startAt: Date; // ISO

  @Prop({ type: Date, required: true })
  endAt: Date; // calculado pela duração do serviço

  @Prop({
    type: String,
    enum: AppointmentStatus,
    default: AppointmentStatus.SCHEDULED,
    index: true,
  })
  status: AppointmentStatus;

  @Prop()
  notes?: string;

  @Prop()
  cancelReason?: string;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);

// Útil para bloquear duplicidade exata
AppointmentSchema.index(
  { professionalId: 1, startAt: 1 },
  { unique: true, partialFilterExpression: { status: 'SCHEDULED' } },
);
