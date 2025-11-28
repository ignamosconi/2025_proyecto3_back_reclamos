import { Injectable } from '@nestjs/common';
import { HistorialRepository } from './historial.repository';
import { Historial } from './schemas/historial.schema';
import { Types } from 'mongoose';
import { AccionesHistorial } from './helpers/acciones-historial.enum';

@Injectable()
export class HistorialService {
     constructor(private readonly historialRepository: HistorialRepository) { }

     async create(
          reclamoId: string | Types.ObjectId,
          accion: AccionesHistorial,
          detalle: string,
          responsableId: string | Types.ObjectId,
          metadata?: Record<string, any>,
     ): Promise<Historial> {
          return this.historialRepository.create({
               reclamoId: reclamoId as any,
               accion,
               detalle,
               responsable: responsableId as any,
               fecha_hora: new Date(),
               metadata,
          });
     }

     async findAllByReclamo(reclamoId: string): Promise<Historial[]> {
          return this.historialRepository.findByReclamoId(reclamoId);
     }
}
