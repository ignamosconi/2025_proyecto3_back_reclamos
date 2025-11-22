import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Area {
  @Prop({ required: true, unique: true })
  nombre: string;

  @Prop({ required: false })
  descripcion?: string;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export type AreaDocument = Area & Document;
export const AreaSchema = SchemaFactory.createForClass(Area);
