import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserRole } from '../helpers/enum.roles';

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, maxlength: 255 })
  nombre: string;

  @Prop({ required: true, maxlength: 255 })
  apellido: string;

  @Prop({ required: true, unique: true, maxlength: 255 })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.CLIENTE })
  rol: UserRole;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Area' }], default: [] })
  areas: Types.ObjectId[];

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);
