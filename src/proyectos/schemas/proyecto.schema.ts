import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Area } from 'src/areasResponsables/schemas/area.schema';
import { User } from 'src/users/schemas/user.schema';

export type ProyectoDocument = Proyecto & Document;

@Schema()
export class Proyecto {
  @Prop({ required: true, unique: true })
  nombre: string;

  // FK a Usuario (Cliente)
  // El modelo de usuario se registra como 'User' (clase `User`), no 'Usuario'.
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  cliente: User;

  // FK a AreaResponsable
  // El modelo de área se registra como 'Area' (clase `Area`), no 'AreaResponsable'.
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Area', required: true })
  areaResponsable: Area;

  // Para el borrado suave (soft-delete)
  @Prop({ default: null, index: true })
  deletedAt: Date;
}

export const ProyectoSchema = SchemaFactory.createForClass(Proyecto);