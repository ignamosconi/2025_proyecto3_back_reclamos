// reclamo.schema.ts
import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prioridad } from '../enums/prioridad.enum';
import { User } from 'src/users/schemas/user.schema';
import { Proyecto } from 'src/proyectos/schemas/proyecto.schema';
import { TipoReclamo } from 'src/tipoReclamo/schemas/tipo-reclamo.schema';
import { Area } from 'src/areasResponsables/schemas/area.schema';
import { Criticidad } from '../enums/criticidad.enum';
import { EstadoReclamo } from '../enums/estado.enum';


@Schema({ timestamps: true })
export class Reclamo extends Document {

  @ApiProperty({ example: 'Fallo en la carga del módulo A' })
  @Prop({ required: true, type: String })
  titulo: string;

  @ApiProperty({ example: 'Al intentar ingresar al módulo, aparece un error 500 y no carga la pantalla de clientes.' })
  @Prop({ required: true, type: String })
  descripcion: string;

  @ApiProperty({ enum: Prioridad, example: Prioridad.MEDIA })
  @Prop({ required: true, type: String, enum: Object.values(Prioridad) })
  prioridad: Prioridad;

  @ApiProperty({ enum: Criticidad, example: Criticidad.NO })
  @Prop({ required: true, type: String, enum: Object.values(Criticidad) })
  criticidad: Criticidad;

  @ApiProperty({ enum: EstadoReclamo, default: EstadoReclamo.PENDIENTE, example: EstadoReclamo.PENDIENTE })
  @Prop({ required: true, type: String, enum: Object.values(EstadoReclamo), default: EstadoReclamo.PENDIENTE })
  estado: EstadoReclamo;

  @ApiProperty({ type: String, format: 'ObjectId', example: '60c72b2f9c3f9a0015b67e7c' })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  fkCliente: User;

  @ApiProperty({ type: String, format: 'ObjectId', example: '60c72b2f9c3f9a0015b67e7d' })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Proyecto' })
  fkProyecto: Proyecto;

  @ApiProperty({ type: String, format: 'ObjectId', example: '60c72b2f9c3f9a0015b67e7e' })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'TipoReclamo' })
  fkTipoReclamo: TipoReclamo;

  @ApiProperty({ type: String, format: 'ObjectId', example: '60c72b2f9c3f9a0015b67e7f' })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Area' })
  fkArea: Area;

  @ApiPropertyOptional({ type: Date, nullable: true })
  @Prop({ type: Date, default: null })
  deletedAt?: Date;
}

export const ReclamoSchema = SchemaFactory.createForClass(Reclamo);

ReclamoSchema.virtual('encargados', {
  ref: 'ReclamoEncargado',
  localField: '_id',
  foreignField: 'fkReclamo',
});

ReclamoSchema.virtual('imagenes', {
  ref: 'Imagen',
  localField: '_id',
  foreignField: 'fkReclamo',
});

// Asegurar que los virtuales se incluyan al convertir a JSON/Object
ReclamoSchema.set('toObject', { virtuals: true });
ReclamoSchema.set('toJSON', { virtuals: true });