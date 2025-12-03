import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserRole } from '../helpers/enum.roles';

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, maxlength: 255 })
  firstName: string;

  @Prop({ required: true, maxlength: 255 })
  lastName: string;

  @Prop({ required: true, unique: true, maxlength: 255 })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({
    required: true,
    type: String,
    enum: UserRole,
    default: UserRole.CLIENTE,
  })
  role: UserRole;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Area' }], default: [] })
  areas: Types.ObjectId[];

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;

  //Token para recuperación de contraseña
  @Prop({ type: String, default: null })
  resetPasswordToken?: string | null;

  @Prop({ type: Date, default: null })
  resetPasswordExpires?: Date | null;

  // 2FA Fields
  @Prop({ type: Boolean, default: false })
  activate2fa: boolean;

  @Prop({ type: String, default: null })
  twoFactorCode?: string | null;

  @Prop({ type: Date, default: null })
  twoFactorCodeExpires?: Date | null;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);
