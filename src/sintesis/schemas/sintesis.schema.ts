// src/sintesis/schemas/sintesis.schema.ts

import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Reclamo } from 'src/reclamo/schemas/reclamo.schema';
import { User } from 'src/users/schemas/user.schema';
import { Area } from 'src/areasResponsables/schemas/area.schema';

@Schema({ timestamps: true, collection: 'sintesis' })
export class Sintesis extends Document {
  @ApiPropertyOptional({ example: 'Resolución del problema', description: 'Título opcional de la síntesis' })
  @Prop({ required: false, type: String, maxlength: 255 })
  nombre?: string;

  @ApiProperty({ 
    example: 'Se ha revisado el problema y se ha implementado una solución. El módulo ahora funciona correctamente.',
    description: 'Contenido de la síntesis (máximo 1000 caracteres)'
  })
  @Prop({ required: true, type: String, maxlength: 1000 })
  descripcion: string;

  @ApiProperty({ type: String, format: 'ObjectId', example: '60c72b2f9c3f9a0015b67e7c' })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Reclamo', index: true })
  fkReclamo: Reclamo;

  @ApiProperty({ type: String, format: 'ObjectId', example: '60c72b2f9c3f9a0015b67e7d' })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  fkCreador: User;

  @ApiProperty({ type: String, format: 'ObjectId', example: '60c72b2f9c3f9a0015b67e7e' })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Area' })
  fkArea: Area;
}

export type SintesisDocument = Sintesis & Document;
export const SintesisSchema = SchemaFactory.createForClass(Sintesis);

// Índice para optimizar búsquedas por reclamo
SintesisSchema.index({ fkReclamo: 1, createdAt: -1 });

