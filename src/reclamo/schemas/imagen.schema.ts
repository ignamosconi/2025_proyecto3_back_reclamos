import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Reclamo } from './reclamo.schema';


@Schema({ timestamps: true }) 
export class Imagen extends Document {

  @ApiProperty({ example: 'screenshot_fallo_01.jpg' })
  @Prop({ required: true, type: String })
  nombre: string;

  @ApiProperty({ example: 's3://bucket-reclamos/uuid_reclamo/img_key.jpg' })
  @Prop({ required: true, type: String, unique: true })
  rutaStorage: string; 

  @ApiProperty({ example: 'image/jpeg' })
  @Prop({ required: true, type: String })
  tipo: string;

  @ApiProperty({ type: String, format: 'ObjectId', example: '60c72b2f9c3f9a0015b67e7c' })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Reclamo' })
  fkReclamo: Reclamo;
}

export const ImagenSchema = SchemaFactory.createForClass(Imagen);