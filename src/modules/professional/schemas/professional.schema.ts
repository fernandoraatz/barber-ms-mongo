import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProfessionalDocument = HydratedDocument<Professional>;

export enum ProfessionalStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Schema({ timestamps: true, collection: 'professionals' })
export class Professional {
  // ✅ Admin cria o profissional sem precisar do userId
  @Prop({ type: Types.ObjectId, ref: 'User', index: true, required: false })
  userId?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop()
  photo?: string;

  @Prop({ type: String, enum: ProfessionalStatus, default: ProfessionalStatus.ACTIVE, index: true })
  status: ProfessionalStatus;

  @Prop({ type: Types.ObjectId, ref: 'ProfessionalCategory', required: true, index: true })
  categoryId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Service' }], default: [] })
  serviceIds: Types.ObjectId[];
}

export const ProfessionalSchema = SchemaFactory.createForClass(Professional);

// 🔐 Garante 1-para-1 entre User e Professional,
// permitindo vários documentos sem userId (não vinculados ainda)
ProfessionalSchema.index(
  { userId: 1 },
  { unique: true, partialFilterExpression: { userId: { $exists: true, $ne: null } } },
);

// Busca textual (opcional)
ProfessionalSchema.index({ name: 'text', description: 'text' });
