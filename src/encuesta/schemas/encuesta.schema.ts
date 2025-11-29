import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Reclamo } from 'src/reclamo/schemas/reclamo.schema';
import { User } from 'src/users/schemas/user.schema';

@Schema({ timestamps: true })
export class Encuesta extends Document {
  @ApiProperty({ example: 5, description: 'Calificación del 1 al 5, siendo 5 excelente' })
  @Prop({ required: true, type: Number, min: 1, max: 5 })
  calificacion: number;

  @ApiProperty({ example: 'Excelente atención y resolución rápida del problema.' })
  @Prop({ required: true, type: String })
  descripcion: string;

  @ApiProperty({ type: String, format: 'ObjectId', example: '60c72b2f9c3f9a0015b67e7c' })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Reclamo' })
  fkReclamo: Reclamo;

  @ApiProperty({ type: String, format: 'ObjectId', example: '60c72b2f9c3f9a0015b67e7d' })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  fkClienteCreador: User;
}

export type EncuestaDocument = Encuesta & Document;
export const EncuestaSchema = SchemaFactory.createForClass(Encuesta);

// Índice único compuesto para asegurar una encuesta por reclamo por cliente
EncuestaSchema.index({ fkReclamo: 1, fkClienteCreador: 1 }, { unique: true });

