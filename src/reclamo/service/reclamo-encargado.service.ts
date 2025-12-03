import { Inject, Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import type { IReclamoEncargadoRepository } from '../repositories/interfaces/reclamo-encargado.repository.interface';
import type { IReclamoRepository } from '../repositories/interfaces/reclamo.repository.interface';
import { Reclamo } from '../schemas/reclamo.schema';
import { EstadoReclamo } from '../enums/estado.enum';
import { UpdateEncargadosDto } from '../dto/update-encargados.dto';
import { AddEncargadoDto } from '../dto/add-encargado.dto';
import { RemoveEncargadoDto } from '../dto/remove-encargado.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { HistorialService } from 'src/historial/historial.service';
import { AccionesHistorial } from '../../historial/helpers/acciones-historial.enum';
import { UserRole } from '../../users/helpers/enum.roles';

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

    // Verificar si ya está asignado
    const already = await this.reclamoEncargadoRepository.isEncargadoAssigned(reclamoId, encargadoId);
    
    if (already) {
      // Si ya está asignado, verificar que no haya otro encargado
      const encargadosCount = await this.reclamoEncargadoRepository.countEncargadosByReclamo(reclamoId);
      if (encargadosCount > 1 || (encargadosCount === 1 && !already)) {
        throw new BadRequestException('Este reclamo ya tiene un encargado asignado. No puedes autoasignarte.');
      }
      // Si es el único asignado, no hacemos nada
    } else {
      // Verificar que no haya otro encargado asignado
      const encargadosCount = await this.reclamoEncargadoRepository.countEncargadosByReclamo(reclamoId);
      if (encargadosCount > 0) {
        throw new BadRequestException('Este reclamo ya tiene un encargado asignado. No puedes autoasignarte.');
      }
      // Asignar al encargado
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
    return encargados.map(e => {
      const encargadoObj = e.toObject ? e.toObject() : e;
      return {
        _id: encargadoObj._id,
        fkEncargado: encargadoObj.fkEncargado,
        fkReclamo: encargadoObj.fkReclamo,
        createdAt: encargadoObj.createdAt,
        updatedAt: encargadoObj.updatedAt,
      };
    });
  }

  /**
   * US 12: Añadir un encargado adicional al reclamo
   * Cualquier encargado asignado puede agregar otros encargados
   * Los encargados añadidos deben pertenecer a la misma área que el reclamo
   */
  async addEncargado(reclamoId: string, actorId: string, data: AddEncargadoDto): Promise<void> {
    const { encargadoId } = data;

    // 1. Validar existencia del reclamo
    const reclamo = await this.reclamoRepository.findById(reclamoId, true);
    if (!reclamo) {
      throw new NotFoundException('Reclamo no encontrado');
    }

    // 2. Validar que el reclamo esté en revisión
    if (reclamo.estado !== EstadoReclamo.EN_REVISION) {
      throw new BadRequestException('Solo se pueden agregar encargados a reclamos en revisión');
    }

    // 3. Validar que el actor esté asignado al reclamo
    const actorIsAssigned = await this.reclamoEncargadoRepository.isEncargadoAssigned(reclamoId, actorId);
    if (!actorIsAssigned) {
      throw new ForbiddenException('Solo los encargados asignados pueden agregar otros encargados a este reclamo');
    }

    // 4. Validar que el nuevo encargado no sea el mismo que el actor
    if (encargadoId === actorId) {
      throw new BadRequestException('No puedes añadirte a ti mismo como encargado adicional');
    }

    // 5. Validar existencia del nuevo encargado
    const nuevoEncargado = await this.userModel.findById(encargadoId).populate('areas').exec();
    if (!nuevoEncargado) {
      throw new NotFoundException('Usuario encargado no encontrado');
    }

    // 6. Validar que sea un encargado
    if (nuevoEncargado.role !== UserRole.ENCARGADO) {
      throw new BadRequestException('El usuario debe tener rol de Encargado');
    }

    // 7. Validar que el encargado pertenezca al área del reclamo
    const reclamoAreaId = reclamo.fkArea && (reclamo.fkArea as any)._id
      ? String((reclamo.fkArea as any)._id)
      : String(reclamo.fkArea);

    const encargadoAreas = nuevoEncargado.areas.map((area: any) =>
      area && area._id ? String(area._id) : String(area)
    );

    if (!encargadoAreas.includes(reclamoAreaId)) {
      throw new BadRequestException('El encargado debe pertenecer a la misma área que el reclamo');
    }

    // 8. Validar que no esté ya asignado
    const alreadyAssigned = await this.reclamoEncargadoRepository.isEncargadoAssigned(reclamoId, encargadoId);
    if (alreadyAssigned) {
      throw new BadRequestException('Este encargado ya está asignado al reclamo');
    }

    // 9. Asignar el encargado
    await this.reclamoEncargadoRepository.assignEncargado(reclamoId, encargadoId);

    // 10. Registrar en el historial
    await this.historialService.create(
      reclamoId,
      AccionesHistorial.AGREGAR_ENCARGADO,
      `Encargado ${nuevoEncargado.firstName} ${nuevoEncargado.lastName} añadido al reclamo`,
      actorId,
      { encargado_agregado: encargadoId }
    );
  }

  /**
   * US 12: Eliminar un encargado del reclamo
   * Cualquier encargado asignado puede eliminar encargados (incluso a sí mismo)
   * Siempre debe quedar al menos un encargado
   */
  async removeEncargado(reclamoId: string, actorId: string, data: RemoveEncargadoDto): Promise<void> {
    const { encargadoId } = data;

    // 1. Validar existencia del reclamo
    const reclamo = await this.reclamoRepository.findById(reclamoId, false);
    if (!reclamo) {
      throw new NotFoundException('Reclamo no encontrado');
    }

    // 2. Validar que el reclamo esté en revisión
    if (reclamo.estado !== EstadoReclamo.EN_REVISION) {
      throw new BadRequestException('Solo se pueden eliminar encargados de reclamos en revisión');
    }

    // 3. Validar que el actor esté asignado al reclamo
    const actorIsAssigned = await this.reclamoEncargadoRepository.isEncargadoAssigned(reclamoId, actorId);
    if (!actorIsAssigned) {
      throw new ForbiddenException('Solo los encargados asignados pueden eliminar encargados de este reclamo');
    }

    // 4. Validar que el encargado a eliminar esté asignado
    const isAssigned = await this.reclamoEncargadoRepository.isEncargadoAssigned(reclamoId, encargadoId);
    if (!isAssigned) {
      throw new NotFoundException('Este encargado no está asignado al reclamo');
    }

    // 5. Contar encargados actuales - debe quedar al menos uno
    const currentCount = await this.reclamoEncargadoRepository.countEncargadosByReclamo(reclamoId);
    if (currentCount <= 1) {
      throw new BadRequestException('No se puede eliminar el último encargado del reclamo. Debe quedar al menos uno.');
    }

    // 6. Obtener datos del encargado para el historial
    const encargadoEliminado = await this.userModel.findById(encargadoId).exec();
    const nombreEncargado = encargadoEliminado 
      ? `${encargadoEliminado.firstName} ${encargadoEliminado.lastName}`
      : 'Encargado';

    // 7. Eliminar la asignación
    await this.reclamoEncargadoRepository.unassignEncargado(reclamoId, encargadoId);

    // 8. Registrar en el historial
    await this.historialService.create(
      reclamoId,
      AccionesHistorial.ELIMINAR_ENCARGADO,
      `Encargado ${nombreEncargado} eliminado del reclamo`,
      actorId,
      { encargado_eliminado: encargadoId }
    );
  }
}
