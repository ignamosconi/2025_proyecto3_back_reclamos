import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AreaDocument = Area & Document;

@Schema({
  timestamps: true, // Añade campos createdAt y updatedAt
  collection: 'areas',
})
export class Area {

  @Prop({
    required: true,
    unique: true, 
    trim: true,
  })
  name: string;

  // Campo para el Soft Delete 
  @Prop({
    required: true,
    default: false,
    index: true,
  })
  isDeleted: boolean;

}

export const AreaSchema = SchemaFactory.createForClass(Area);