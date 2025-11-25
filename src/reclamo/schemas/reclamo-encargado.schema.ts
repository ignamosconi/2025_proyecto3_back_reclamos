import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Reclamo } from './reclamo.schema';
import { User } from 'src/users/schemas/user.schema';


@Schema({ timestamps: true }) 
export class ReclamoEncargado extends Document {

  @ApiProperty({ type: String, format: 'ObjectId', description: 'ID del Reclamo asociado.' })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Reclamo' })
  fkReclamo: Reclamo;

  @ApiProperty({ type: String, format: 'ObjectId', description: 'ID del Usuario (Encargado) asignado.' })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  fkEncargado: User;
}

export const ReclamoEncargadoSchema = SchemaFactory.createForClass(ReclamoEncargado);

ReclamoEncargadoSchema.index({ fkReclamo: 1, fkEncargado: 1 }, { unique: true });