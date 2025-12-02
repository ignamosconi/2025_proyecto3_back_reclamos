import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Historial, HistorialDocument } from './schemas/historial.schema';

@Injectable()
export class HistorialRepository {
     constructor(
          @InjectModel(Historial.name) private readonly historialModel: Model<HistorialDocument>,
     ) { }

     async create(data: Partial<Historial>): Promise<Historial> {
          const created = new this.historialModel(data);
          return created.save();
     }

     async findByReclamoId(reclamoId: string): Promise<Historial[]> {
          return this.historialModel
               .find({ reclamoId: reclamoId })
               .sort({ fecha_hora: -1 }) // Orden descendente (más reciente primero)
               .populate('responsable', 'firstName lastName email') // Poblar datos básicos del responsable
               .exec();
     }
}
