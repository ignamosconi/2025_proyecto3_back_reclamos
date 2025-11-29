import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/users/schemas/user.schema';
import { Reclamo } from 'src/reclamo/schemas/reclamo.schema';

@Schema({ 
  timestamps: true,
  collection: 'comentarios',
})
export class Comentario extends Document {
  @ApiProperty({
    description: 'Texto del comentario (máximo 1000 caracteres).',
    example: 'Necesitamos revisar este caso con el equipo de desarrollo.',
    maxLength: 1000,
  })
  @Prop({ 
    required: true, 
    type: String,
    maxlength: 1000,
  })
  texto: string;

  @ApiProperty({
    description: 'ID del autor del comentario (Usuario).',
    type: String,
    format: 'ObjectId',
    example: '60c72b2f9c3f9a0015b67e7d',
  })
  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true,
  })
  autor: MongooseSchema.Types.ObjectId;

  @ApiProperty({
    description: 'ID del reclamo asociado.',
    type: String,
    format: 'ObjectId',
    example: '60c72b2f9c3f9a0015b67e7c',
  })
  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'Reclamo', 
    required: true,
    index: true,
  })
  fkReclamo: MongooseSchema.Types.ObjectId;

  @ApiProperty({
    description: 'Fecha y hora de creación del comentario.',
    type: Date,
  })
  @Prop({ 
    type: Date, 
    default: Date.now,
    required: true,
  })
  fecha_hora: Date;
}

export const ComentarioSchema = SchemaFactory.createForClass(Comentario);

