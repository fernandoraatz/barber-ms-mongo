import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AppointmentDocument = HydratedDocument<Appointment>;

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED', // Agendado
  COMPLETED = 'COMPLETED', // Finalizado
}

@Schema({ timestamps: true, collection: 'appointments' })
export class Appointment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Professional', required: true, index: true })
  professionalId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Service', required: true })
  serviceId: Types.ObjectId;

  @Prop({ type: Date, required: true, index: true })
  startAt: Date; // UTC

  @Prop({ type: Date, required: true })
  endAt: Date; // UTC (startAt + 60min)

  @Prop({
    type: String,
    enum: AppointmentStatus,
    default: AppointmentStatus.SCHEDULED,
    index: true,
  })
  status: AppointmentStatus;

  @Prop() notes?: string;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);

// evita duplo agendamento mesmo slot (enquanto status = SCHEDULED)
AppointmentSchema.index(
  { professionalId: 1, startAt: 1 },
  { unique: true, partialFilterExpression: { status: 'SCHEDULED' } },
);
