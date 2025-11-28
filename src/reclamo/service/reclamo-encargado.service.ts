import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { IReclamoEncargadoRepository } from '../repositories/interfaces/reclamo-encargado.repository.interface';
import type { IReclamoRepository } from '../repositories/interfaces/reclamo.repository.interface';
import { Reclamo } from '../schemas/reclamo.schema';
import { EstadoReclamo } from '../enums/estado.enum';
import { UpdateEncargadosDto } from '../dto/update-encargados.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { HistorialService } from 'src/historial/historial.service';
import { AccionesHistorial } from '../../historial/helpers/acciones-historial.enum';

@Injectable()
export class ReclamoEncargadoService {
  constructor(
    @Inject('IReclamoRepository')
    private readonly reclamoRepository: IReclamoRepository,

    @Inject('IReclamoEncargadoRepository')
    private readonly reclamoEncargadoRepository: IReclamoEncargadoRepository,

    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly historialService: HistorialService,
  ) { }

  async autoAssign(reclamoId: string, encargadoId: string): Promise<Reclamo> {
    // Validar existencia del reclamo
    const reclamo = await this.reclamoRepository.findById(reclamoId, false);
    if (!reclamo) throw new NotFoundException('Reclamo no encontrado');

    // US 7: Validar que el reclamo esté en PENDIENTE para auto-asignarse
    if (reclamo.estado !== EstadoReclamo.PENDIENTE) {
      throw new BadRequestException('El reclamo ya ha sido asignado o procesado.');
    }

    // Validar existencia del usuario/encargado
    const encargado = await this.userModel.findById(encargadoId).exec();
    if (!encargado) throw new NotFoundException('Usuario encargado no encontrado');

    // Evitar duplicados
    const already = await this.reclamoEncargadoRepository.isEncargadoAssigned(reclamoId, encargadoId);
    if (!already) {
      await this.reclamoEncargadoRepository.assignEncargado(reclamoId, encargadoId);
    }

    // Poner el reclamo en EN_REVISION si aún no lo está
    const updated = await this.reclamoRepository.updateEstadoToEnRevision(reclamoId);
    if (!updated) throw new NotFoundException('Fallo al actualizar el estado del reclamo');

    // Emitir evento para Historial (ASIGNACION_AUTOMATICA)
    await this.historialService.create(
      reclamoId,
      AccionesHistorial.AUTOASIGNAR,
      'El usuario se ha auto-asignado al reclamo.',
      encargadoId
    );

    // Emitir evento para Historial (CAMBIO_ESTADO)
    // Al auto-asignarse, pasa de PENDIENTE a EN_REVISION
    await this.historialService.create(
      reclamoId,
      AccionesHistorial.CAMBIO_ESTADO,
      `Estado cambiado de ${EstadoReclamo.PENDIENTE} a ${EstadoReclamo.EN_REVISION} por auto-asignación.`,
      encargadoId,
      {
        estado_anterior: EstadoReclamo.PENDIENTE,
        estado_actual: EstadoReclamo.EN_REVISION,
      }
    );

    return updated;
  }

  async updateTeam(reclamoId: string, adminId: string, data: UpdateEncargadosDto): Promise<void> {
    // Validar reclamo
    const reclamo = await this.reclamoRepository.findById(reclamoId, false);
    if (!reclamo) throw new NotFoundException('Reclamo no encontrado');

    // Procesar eliminaciones
    if (data.removeEncargadosIds && data.removeEncargadosIds.length > 0) {
      for (const encId of data.removeEncargadosIds) {
        await this.reclamoEncargadoRepository.unassignEncargado(reclamoId, encId);
      }
    }

    let addedCount = 0;
    // Procesar altas
    if (data.addEncargadosIds && data.addEncargadosIds.length > 0) {
      for (const encId of data.addEncargadosIds) {
        // Verificar existencia del usuario
        const u = await this.userModel.findById(encId).exec();
        if (!u) continue; // ignorar IDs inválidos

        const already = await this.reclamoEncargadoRepository.isEncargadoAssigned(reclamoId, encId);
        if (!already) {
          await this.reclamoEncargadoRepository.assignEncargado(reclamoId, encId);
          addedCount++;
        }
      }
    }

    // Si se agregaron encargados, asegurar estado EN_REVISION
    let nuevoEstado: EstadoReclamo | null = null;
    const estadoAnterior = reclamo.estado;

    if (addedCount > 0 && reclamo.estado === EstadoReclamo.PENDIENTE) {
      await this.reclamoRepository.updateEstadoToEnRevision(reclamoId);
      nuevoEstado = EstadoReclamo.EN_REVISION;
    }

    // Si tras la operación no quedan encargados, volver a PENDIENTE
    const remaining = await this.reclamoEncargadoRepository.countEncargadosByReclamo(reclamoId);
    if (remaining === 0 && reclamo.estado !== EstadoReclamo.PENDIENTE) {
      await this.reclamoRepository.updateEstado(reclamoId, EstadoReclamo.PENDIENTE);
      nuevoEstado = EstadoReclamo.PENDIENTE;
    }

    // Emitir evento para Historial (CAMBIO_ESTADO) si hubo cambio
    if (nuevoEstado) {
      await this.historialService.create(
        reclamoId,
        AccionesHistorial.CAMBIO_ESTADO,
        `Estado cambiado de ${estadoAnterior} a ${nuevoEstado} por actualización de equipo.`,
        adminId,
        {
          estado_anterior: estadoAnterior,
          estado_actual: nuevoEstado,
        }
      );
    }

    // Emitir evento para Historial (ACTUALIZACION_EQUIPO) con adminId y cambios
    if (data.addEncargadosIds && data.addEncargadosIds.length > 0) {
      await this.historialService.create(
        reclamoId,
        AccionesHistorial.AGREGAR_ENCARGADO,
        `Se agregaron encargados: ${data.addEncargadosIds.join(', ')}`,
        adminId
      );
    }
    if (data.removeEncargadosIds && data.removeEncargadosIds.length > 0) {
      await this.historialService.create(
        reclamoId,
        AccionesHistorial.ELIMINAR_ENCARGADO,
        `Se eliminaron encargados: ${data.removeEncargadosIds.join(', ')}`,
        adminId
      );
    }
  }

  async getEncargados(reclamoId: string): Promise<any[]> {
    const reclamo = await this.reclamoRepository.findById(reclamoId, false);
    if (!reclamo) throw new NotFoundException('Reclamo no encontrado');

    const encargados = await this.reclamoEncargadoRepository.findEncargadosByReclamo(reclamoId);
    return encargados.map(e => e.fkEncargado);
  }
}
