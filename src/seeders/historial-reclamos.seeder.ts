import { Injectable } from '@nestjs/common';
import { HistorialRepository } from '../historial/historial.repository';
import { IReclamoRepository } from '../reclamo/repositories/interfaces/reclamo.repository.interface';

import { AccionesHistorial } from '../historial/helpers/acciones-historial.enum';

@Injectable()
export class HistorialReclamosSeeder {
     constructor(
          private readonly historialRepo: HistorialRepository,
          private readonly reclamoRepo: IReclamoRepository,
     ) { }

     async run() {
          // Verificar si ya hay historial
          // Como no hay método count en repo, asumimos que si hay reclamos, verificamos el primero
          const reclamos = await this.reclamoRepo.findAllPaginated({ limit: 10, page: 1 });
          if (reclamos.total === 0) {
               console.log('No hay reclamos para sembrar historial.');
               return;
          }

          console.log('Sembrando Historial de Reclamos...');

          for (const reclamo of reclamos.data) {
               const existingHistory = await this.historialRepo.findByReclamoId(String(reclamo._id));
               if (existingHistory.length > 0) continue;

               // Crear historial de creación
               await this.historialRepo.create({
                    reclamoId: reclamo._id as any,
                    accion: AccionesHistorial.CREACION,
                    detalle: 'Reclamo creado por seed.',
                    responsable: reclamo.fkCliente as any,
                    fecha_hora: (reclamo as any).createdAt || new Date(),
               });
          }

          console.log('Historial de Reclamos sembrado.');
     }
}
