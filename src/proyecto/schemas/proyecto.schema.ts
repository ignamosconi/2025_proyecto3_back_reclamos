import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProjectDocument = Project & Document;

@Schema({
  timestamps: true, // Útil para saber cuándo fue creado/modificado
  collection: 'projects',
})
export class Project {
  // PK implícita: _id (Types.ObjectId)

  // Nombre (nombre [UNIQUE] - Criterio Obligatorio)
  @Prop({
    required: true,
    unique: true, // Asegura que el nombre del proyecto no se repita
    trim: true,
  })
  name: string;

  // Cliente Asociado (idCliente - FK - Criterio Obligatorio)
  @Prop({
    required: true,
    //type: Types.ObjectId,
    //ref: 'Client', // Referencia a la colección de Clientes
  })
    client: string;
  //client: Types.ObjectId;

  // Área Responsable (idÁrea - FK - Criterio Obligatorio)
  // Utilizamos Types.ObjectId si manejarás una colección de Áreas
  @Prop({
    required: true,
  //  type: Types.ObjectId,
   // ref: 'Area', // Referencia a la colección de Áreas
  })
    responsibleArea: string;
  //responsibleArea: Types.ObjectId;

  // Campo para la descripción opcional
//   @Prop({
//     trim: true,
//     default: null,
//   })
//   description?: string;

    @Prop({
        required: true,
        default: false, // Por defecto, NO está eliminado
        index: true,     // Útil para búsquedas rápidas
    })
    isDeleted: boolean; 
}

export const ProjectSchema = SchemaFactory.createForClass(Project);