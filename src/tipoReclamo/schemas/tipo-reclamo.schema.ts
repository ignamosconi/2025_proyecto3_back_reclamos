import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class TipoReclamo {
  @Prop({ required: true, unique: true, maxlength: 64 })
  nombre: string;

  @Prop({ required: false, maxlength: 255})
  descripcion?: string;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export type TipoReclamoDocument = TipoReclamo & Document;
export const TipoReclamoSchema = SchemaFactory.createForClass(TipoReclamo);
