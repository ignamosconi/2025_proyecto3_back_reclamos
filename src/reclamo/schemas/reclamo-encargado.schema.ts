import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger'; // 👈 Importación clave

@Schema({ 
  timestamps: true,
  collection: 'reclamosEncargados',
})
export class ReclamoEncargado extends Document {

  
  @ApiProperty({
    description: 'ID del Reclamo al que está asignado el Encargado.',
    type: String, 
    format: 'ObjectId',
    example: '60c72b2f9c3f9a0015b67e7d'
  })
  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'Reclamo', 
    required: true,
    index: true, 
  })
  fkReclamo: MongooseSchema.Types.ObjectId; 

  @ApiProperty({
    description: 'ID del Encargado (Usuario Staff) asignado al Reclamo.',
    type: String, 
    format: 'ObjectId',
    example: '60c72b2f9c3f9a0015b67e7e'
  })
  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true, 
  })
  fkEncargado: MongooseSchema.Types.ObjectId; // FK a User (Encargado)
  
  @ApiProperty({
    description: 'Indica si este encargado es el principal (se autoasignó al reclamo)',
    type: Boolean,
    default: false,
  })
  @Prop({ 
    type: Boolean, 
    default: false,
  })
  isPrincipal: boolean; // Indica si es el encargado principal (autoasignado)
  
  // Las propiedades de Mongoose 'createdAt' y 'updatedAt' se añaden automáticamente.
}

export const ReclamoEncargadoSchema = SchemaFactory.createForClass(ReclamoEncargado);

// Índice compuesto para la unicidad:
// Índice compuesto para evitar asignaciones duplicadas (Reclamo <-> Encargado)
ReclamoEncargadoSchema.index({ fkReclamo: 1, fkEncargado: 1 }, { unique: true });