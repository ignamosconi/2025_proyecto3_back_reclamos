import { Injectable, Inject } from '@nestjs/common';
import { HistorialRepository } from '../historial/historial.repository';
import { IReclamoRepository } from '../reclamo/repositories/interfaces/reclamo.repository.interface';
import { IReclamoEncargadoRepository } from '../reclamo/repositories/interfaces/reclamo-encargado.repository.interface';
import { AccionesHistorial } from '../historial/helpers/acciones-historial.enum';

@Injectable()
export class HistorialReclamosSeeder {
  constructor(
    private readonly historialRepo: HistorialRepository,
    private readonly reclamoRepo: IReclamoRepository,
    @Inject('IReclamoEncargadoRepository')
    private readonly reclamoEncargadoRepo: IReclamoEncargadoRepository,
  ) {}

  async run() {
    console.log('Sembrando Historial de Reclamos...');

    // Obtener todos los reclamos
    const reclamos = await this.reclamoRepo.findAllPaginated({ limit: 200, page: 1 });
    if (reclamos.total === 0) {
      console.log('No hay reclamos para sembrar historial.');
      return;
    }

    let eventosCreados = 0;
    let skipped = 0;

    for (const reclamo of reclamos.data) {
      const reclamoId = String((reclamo as any)._id || reclamo.id);
      const existingHistory = await this.historialRepo.findByReclamoId(reclamoId);
      
      // Si ya tiene historial, saltarlo o agregar solo eventos faltantes
      if (existingHistory.length > 5) {
        skipped++;
        continue;
      }

      const fechaCreacionRaw = (reclamo as any).createdAt || new Date();
      const fechaCreacion = fechaCreacionRaw instanceof Date ? fechaCreacionRaw : new Date(fechaCreacionRaw);
      const clienteId = (reclamo as any).fkCliente?._id || (reclamo as any).fkCliente;

      // Evento 1: Creación del reclamo
      try {
        await this.historialRepo.create({
          reclamoId: reclamo._id as any,
          accion: AccionesHistorial.CREACION,
          detalle: 'Reclamo creado por el cliente.',
          responsable: clienteId as any,
          fecha_hora: fechaCreacion,
        });
        eventosCreados++;
      } catch (error) {
        // Ignorar errores de duplicados
      }

      // Evento 2: Si está en revisión, agregar autoasignación
      if (reclamo.estado === 'En Revisión') {
        try {
          const historialAsignacion = existingHistory.find(
            (h: any) => h.accion === AccionesHistorial.AUTOASIGNAR,
          );
          if (!historialAsignacion) {
            // Obtener encargados asignados al reclamo
            const encargadosIds = await this.reclamoEncargadoRepo.findEncargadosIdsByReclamo(reclamoId);
            if (encargadosIds.length > 0) {
              const fechaAsignacion = new Date(fechaCreacion.getTime() + 1000 * 60 * 60);
              // Usar el primer encargado como responsable
              await this.historialRepo.create({
                reclamoId: reclamo._id as any,
                accion: AccionesHistorial.AUTOASIGNAR,
                detalle: 'Un encargado se ha auto-asignado al reclamo.',
                responsable: encargadosIds[0] as any,
                fecha_hora: fechaAsignacion,
              });
              eventosCreados++;
            }
          }
        } catch (error) {
          // Continuar si hay error
        }
      }

      // Evento 3: Cambio de estado si no es pendiente
      if (reclamo.estado !== 'Pendiente') {
        try {
          const historialCambioEstado = existingHistory.find(
            (h: any) => h.accion === AccionesHistorial.CAMBIO_ESTADO,
          );
          if (!historialCambioEstado) {
            // Obtener encargado como responsable, o usar cliente si no hay encargado
            let responsableId = clienteId;
            try {
              const encargadosIds = await this.reclamoEncargadoRepo.findEncargadosIdsByReclamo(reclamoId);
              if (encargadosIds.length > 0) {
                responsableId = encargadosIds[0];
              }
            } catch (error) {
              // Usar cliente como fallback
            }
            
            const fechaCambio = new Date(fechaCreacion.getTime() + 1000 * 60 * 60 * 2); // 2 horas después
            await this.historialRepo.create({
              reclamoId: reclamo._id as any,
              accion: AccionesHistorial.CAMBIO_ESTADO,
              detalle: `Estado cambiado de Pendiente a ${reclamo.estado}.`,
              responsable: responsableId as any,
              fecha_hora: fechaCambio,
              metadata: {
                estado_anterior: 'Pendiente',
                estado_actual: reclamo.estado,
              },
            });
            eventosCreados++;
          }
        } catch (error) {
          // Continuar si hay error
        }
      }

      // Evento 4: Agregar algunos comentarios como eventos de historial (si hay comentarios)
      // Esto sería ideal pero requeriría cruzar con el repositorio de comentarios
      // Por ahora solo creamos eventos básicos

      if (eventosCreados % 50 === 0 && eventosCreados > 0) {
        console.log(`Eventos de historial creados: ${eventosCreados}`);
      }
    }

    console.log(`Historial de Reclamos procesado: ${eventosCreados} eventos creados, ${skipped} reclamos ya tenían historial suficiente.`);
  }
}
