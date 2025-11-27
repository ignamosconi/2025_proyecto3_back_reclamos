import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IReclamoEncargadoRepository } from '../repositories/interfaces/reclamo-encargado.repository.interface';
import type { IReclamoRepository } from '../repositories/interfaces/reclamo.repository.interface';
import { Reclamo } from '../schemas/reclamo.schema';
import { EstadoReclamo } from '../enums/estado.enum';
import { UpdateEncargadosDto } from '../dto/update-encargados.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../users/schemas/user.schema';

@Injectable()
export class ReclamoEncargadoService {
  constructor(
    @Inject('IReclamoRepository')
    private readonly reclamoRepository: IReclamoRepository,

    @Inject('IReclamoEncargadoRepository')
    private readonly reclamoEncargadoRepository: IReclamoEncargadoRepository,

    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async autoAssign(reclamoId: string, encargadoId: string): Promise<Reclamo> {
    // Validar existencia del reclamo
    const reclamo = await this.reclamoRepository.findById(reclamoId, false);
    if (!reclamo) throw new NotFoundException('Reclamo no encontrado');

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

    // TODO: Emitir evento para Historial (ASIGNACION_AUTOMATICA)

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
    if (addedCount > 0) {
      await this.reclamoRepository.updateEstadoToEnRevision(reclamoId);
    }

    // Si tras la operación no quedan encargados, volver a PENDIENTE
    const remaining = await this.reclamoEncargadoRepository.countEncargadosByReclamo(reclamoId);
    if (remaining === 0) {
      await this.reclamoRepository.updateEstado(reclamoId, EstadoReclamo.PENDIENTE);
    }

    // TODO: Emitir evento para Historial (ACTUALIZACION_EQUIPO) con adminId y cambios
  }

}
