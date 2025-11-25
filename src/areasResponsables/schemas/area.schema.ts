import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Area {
  @Prop({ required: true, unique: true, maxlength: 64 })
  nombre: string;

  @Prop({ required: false, maxlength: 255 })
  descripcion?: string;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export type AreaDocument = Area & Document;
export const AreaSchema = SchemaFactory.createForClass(Area);
