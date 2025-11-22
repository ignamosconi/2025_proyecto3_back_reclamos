import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class TipoReclamo {
  @Prop({ required: true, unique: true })
  nombre: string;

  @Prop({ required: false })
  descripcion?: string;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export type TipoReclamoDocument = TipoReclamo & Document;
export const TipoReclamoSchema = SchemaFactory.createForClass(TipoReclamo);
