import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Reclamo } from './reclamo.schema';

@Schema({ collection: 'imagenes' })
export class Imagen extends Document {
  @ApiProperty({ example: 'evidencia-1.png' })
  @Prop({ required: true, type: String })
  nombre: string;

  // Almacenar binario en Mongo como Buffer
  @ApiProperty({ type: 'string', format: 'binary' })
  @Prop({ required: true, type: Buffer })
  imagen: Buffer;

  @ApiProperty({ example: 'image/png' })
  @Prop({ required: true, type: String })
  tipo: string;

  @ApiProperty({ type: String, format: 'ObjectId' })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Reclamo' })
  fkReclamo: Reclamo;
}

export const ImagenSchema = SchemaFactory.createForClass(Imagen);