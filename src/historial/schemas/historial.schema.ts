import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Reclamo } from '../../reclamo/schemas/reclamo.schema';

export type HistorialDocument = Historial & Document;

@Schema({ collection: 'historiales', timestamps: true })
export class Historial {
     @Prop({ required: true })
     fecha_hora: Date;

     @Prop({ type: Types.ObjectId, ref: 'User', required: true })
     responsable: User | Types.ObjectId;

     @Prop({ required: true })
     accion: string;

     @Prop({ required: true })
     detalle: string;

     @Prop({ type: Object, required: false })
     metadata: Record<string, any>;

     @Prop({ type: Types.ObjectId, ref: 'Reclamo', required: true })
     reclamoId: Reclamo | Types.ObjectId;
}

export const HistorialSchema = SchemaFactory.createForClass(Historial);
