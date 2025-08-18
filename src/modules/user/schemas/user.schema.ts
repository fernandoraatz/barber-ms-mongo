import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  CLIENT = 'CLIENT',
  PROFESSIONAL = 'PROFESSIONAL',
  ADMIN = 'ADMIN',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  avatar?: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.CLIENT })
  role: UserRole;

  @Prop()
  phone?: string;

  @Prop()
  password?: string; // pode ser null em logins sociais
}

export const UserSchema = SchemaFactory.createForClass(User);
