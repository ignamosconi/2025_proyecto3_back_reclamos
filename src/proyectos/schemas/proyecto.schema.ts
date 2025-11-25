import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Area } from 'src/areasResponsables/schemas/area.schema';
import { User } from 'src/users/schemas/user.schema';

export type ProyectoDocument = Proyecto & Document;

@Schema()
export class Proyecto {
  @ApiProperty({
    description: 'Nombre único del proyecto.',
    example: 'Implementación de Plataforma E-commerce',
  })
  @Prop({ required: true, unique: true })
  nombre: string;

  // FK a Usuario (Cliente)
  // El modelo de usuario se registra como 'User' (clase `User`), no 'Usuario'.
  @ApiProperty({
    description: 'ID del cliente asociado al proyecto (referencia a User).',
    example: '64faebab34da9a3f3c3f92ab',
    type: String,
  })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  cliente: User;

  // FK a AreaResponsable
  // El modelo de área se registra como 'Area' (clase `Area`), no 'AreaResponsable'.
  @ApiProperty({
    description: 'ID del área responsable del proyecto (referencia a Area).',
    example: '64faec0b12dfae43e25e87d9',
    type: String,
  })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Area', required: true })
  areaResponsable: Area;

  // Para el borrado suave (soft-delete)
  
  @ApiProperty({
    description: 'Fecha de borrado suave (soft delete). Null si el proyecto está activo.',
    example: null,
    type: Date,
    nullable: true,
  })
  @Prop({ default: null, index: true })
  deletedAt: Date;
}

export const ProyectoSchema = SchemaFactory.createForClass(Proyecto);