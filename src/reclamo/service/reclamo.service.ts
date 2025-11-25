// src/reclamos/services/reclamos.service.ts

import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

// Interfaces y DTOs

import { CreateReclamoDto } from '../dto/create-reclamo.dto';
import { UpdateReclamoDto } from '../dto/update-reclamo.dto';
import { GetReclamoQueryDto } from '../dto/get-reclamo-query.dto';

import { EstadoReclamo } from '../enums/estado.enum';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { IReclamoService } from './interfaces/reclamo.service.interface';
import { IReclamoRepository } from '../repositories/interfaces/reclamo.repository.interface';
import { IReclamoEncargadoRepository } from '../repositories/interfaces/reclamo-encargado.repository.interface';
import type { IProyectosService } from 'src/proyectos/services/proyecto.service.interface';
import { Reclamo } from '../schemas/reclamo.schema';
import { PaginatedReclamoResponseDto } from '../dto/pag-reclamo-response.dto';
import { UpdateEncargadosDto } from '../dto/update-encargados.dto';
import { ReclamoResponseDto } from '../dto/reclamo-response.dto';

@Injectable()
export class ReclamoService implements IReclamoService {
  constructor(
    @Inject('IReclamoRepository')
    private readonly reclamoRepository: IReclamoRepository,
    
    @Inject('IReclamoEncargadoRepository')
    private readonly reclamoEncargadoRepository: IReclamoEncargadoRepository,

    // Inyectamos el servicio de proyectos para obtener el área
    @Inject('IProyectosService')
    private readonly proyectosService: IProyectosService,

    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  // ==================================================================
  // LÓGICA DEL CLIENTE (US 7)
  // ==================================================================

  async create(data: CreateReclamoDto, userId: string): Promise<Reclamo> {
    
    // 1. Validar Cliente (Usuario logueado)
    const clienteExists = await this.userModel.exists({ _id: userId });
    if (!clienteExists) {
      throw new NotFoundException(`Usuario con ID "${userId}" no encontrado.`);
    }

    // 2. Obtener Proyecto y su Área Responsable
    // "El area viene de la mano con proyecto"
    let areaId: string;
    try {
      const proyecto = await this.proyectosService.findById(data.fkProyecto);
      if (!proyecto) { // Doble check por seguridad
         throw new NotFoundException('El proyecto indicado no existe.');
      }
      // Convertimos a string por seguridad
      areaId = proyecto.areaResponsable.toString(); 

      if (!areaId) {
        throw new ConflictException(`El proyecto "${proyecto.nombre}" no tiene un Área Responsable asignada.`);
      }

    } catch (error) {
       // Capturamos errores del servicio de proyectos
       if (error instanceof NotFoundException) throw error;
       throw new BadRequestException('Error al validar el proyecto asociado.');
    }

    // 3. Crear Reclamo
    const nuevoReclamo = await this.reclamoRepository.create(data, userId, areaId);

    // TODO: Emitir evento para módulo Historial (CREACION)
    
    return nuevoReclamo;
  }

  async findAll(query: GetReclamoQueryDto, userId: string): Promise<PaginatedReclamoResponseDto> {
    const result = await this.reclamoRepository.findAllPaginated(query, userId);
    
    return {
      // Mapeamos cada documento de Mongoose al formato del DTO
      data: result.data.map((reclamo) => {
        // toObject() convierte el Documento de Mongoose a un objeto plano de JS
        const doc = reclamo.toObject(); 
        
        return {
          ...doc,
          // Aseguramos que _id sea string (en el DTO es string, en Mongoose es ObjectId)
          _id: doc._id.toString(),
          // Si tienes FKs pobladas o no, toObject las maneja, pero si necesitas strings:
          fkCliente: doc.fkCliente?.toString(),
          fkProyecto: doc.fkProyecto?.toString(),
          fkTipoReclamo: doc.fkTipoReclamo?.toString(),
          fkArea: doc.fkArea?.toString(),
        } as unknown as ReclamoResponseDto; // Casteo final para asegurar compatibilidad
      }),
      total: result.total,
      page: result.page,
      limit: result.limit
    };
  }

  async findById(id: string): Promise<Reclamo> {
    const reclamo = await this.reclamoRepository.findById(id, true); // populate = true
    if (!reclamo) {
      throw new NotFoundException(`Reclamo con ID ${id} no encontrado.`);
    }
    return reclamo;
  }

  async update(id: string, data: UpdateReclamoDto, userId: string): Promise<Reclamo> {
    // 1. Validar propiedad y estado
    const reclamo = await this.validateOwnershipAndStatus(id, userId, EstadoReclamo.PENDIENTE);

    // 2. Actualizar
    const updated = await this.reclamoRepository.update(id, data);

    if (!updated) {
        throw new NotFoundException(`Fallo al actualizar el Reclamo con ID ${id}.`);
    }
    
    // TODO: Emitir evento para módulo Historial (MODIFICACION)

    return updated;
  }

  async softDelete(id: string, userId: string): Promise<Reclamo> {
    // 1. Validar propiedad y estado
    await this.validateOwnershipAndStatus(id, userId, EstadoReclamo.PENDIENTE);

    // 2. Eliminar lógicamente
    const deleted = await this.reclamoRepository.softDelete(id);
    if (!deleted) {
        throw new NotFoundException(`Fallo al eliminar lógicamente el Reclamo con ID ${id}.`);
    }
    
    // TODO: Emitir evento para módulo Historial (ELIMINACION_LOGICA)

    return deleted;
  }

  async restore(id: string, userId: string): Promise<Reclamo> {
    // Para restaurar, no validamos estado PENDIENTE, solo propiedad.
    const reclamo = await this.reclamoRepository.findById(id, false);
    
    if (!reclamo) throw new NotFoundException(`Reclamo con ID ${id} no encontrado.`);
    if (reclamo.fkCliente.toString() !== userId) throw new ForbiddenException('No tienes permiso para acceder a este reclamo.');
    if (!reclamo.deletedAt) throw new BadRequestException('El reclamo no está eliminado.');

    const restored = await this.reclamoRepository.restore(id);
    if (!restored) {
        throw new NotFoundException(`Fallo al restaurar el Reclamo con ID ${id}.`);
    }

    // TODO: Emitir evento para módulo Historial (RESTAURACION)
    return restored;
  }

  // ==================================================================
  // LÓGICA DE FLUJO DE TRABAJO (US 11, US 12, US 8)
  // ==================================================================

  async autoAssign(reclamoId: string, encargadoId: string): Promise<Reclamo> {
    const reclamo = await this.reclamoRepository.findById(reclamoId, false);
    if (!reclamo) throw new NotFoundException(`Reclamo no encontrado.`);

    // 1. Validaciones US 11
    if (reclamo.estado !== EstadoReclamo.PENDIENTE) {
      throw new ConflictException('Solo se puede autoasignar un reclamo en estado PENDIENTE.');
    }

    // Validar que el reclamo no tenga ya encargados (por si acaso)
    const count = await this.reclamoEncargadoRepository.countEncargadosByReclamo(reclamoId);
    if (count > 0) {
        throw new ConflictException('El reclamo ya tiene encargados. No puede usar autoasignación.');
    }

    // 2. Asignación N:M
    await this.reclamoEncargadoRepository.assignEncargado(reclamoId, encargadoId);

    // 3. Cambio de Estado
    const updatedReclamo = await this.reclamoRepository.updateEstadoToEnRevision(reclamoId);

    if (!updatedReclamo) {
        throw new NotFoundException('Fallo al actualizar el estado del reclamo tras la autoasignación.');
    }

    // TODO: Emitir evento para módulo Historial (AUTOASIGNACION)

    return updatedReclamo;
  }

  async updateTeam(reclamoId: string, adminId: string, data: UpdateEncargadosDto): Promise<void> {
    const reclamo = await this.reclamoRepository.findById(reclamoId, false);
    if (!reclamo) throw new NotFoundException(`Reclamo no encontrado.`);

    // 1. Validaciones US 12
    if (reclamo.estado !== EstadoReclamo.EN_REVISION) {
       throw new ConflictException('La gestión de equipo solo está disponible en estado EN REVISIÓN.');
    }

    // Verificar que quien solicita (adminId) sea parte del equipo actual
    const isAssigned = await this.reclamoEncargadoRepository.isEncargadoAssigned(reclamoId, adminId);
    if (!isAssigned) {
        throw new ForbiddenException('Solo un encargado asignado al reclamo puede modificar el equipo.');
    }

    // 2. Procesar Eliminaciones
    if (data.removeEncargadosIds?.length) {
        // Validar que no vaciemos el equipo
        const currentCount = await this.reclamoEncargadoRepository.countEncargadosByReclamo(reclamoId);
        if (currentCount <= data.removeEncargadosIds.length) {
             // Chequear si los que quedan son distintos a los que borramos
             // Simplificación: Bloquear si intenta borrar igual o más cantidad de la que hay
             throw new BadRequestException('No se puede dejar el reclamo sin encargados.');
        }

        for (const idToRemove of data.removeEncargadosIds) {
            await this.reclamoEncargadoRepository.unassignEncargado(reclamoId, idToRemove);
            // TODO: Historial (DESASIGNACION)
        }
    }

    // 3. Procesar Adiciones
    if (data.addEncargadosIds?.length) {
        for (const idToAdd of data.addEncargadosIds) {
            try {
                await this.reclamoEncargadoRepository.assignEncargado(reclamoId, idToAdd);
                // TODO: Historial (ASIGNACION)
            } catch (error) {
                // Ignoramos duplicados
            }
        }
    }
  }

  async reassignArea(reclamoId: string, nuevaAreaId: string): Promise<Reclamo> {
    // 1. Limpiar encargados
    await this.reclamoRepository.clearEncargados(reclamoId);
    
    // 2. Actualizar Area y poner en Pendiente
    const updated = await this.reclamoRepository.updateArea(reclamoId, nuevaAreaId);
    
    if(!updated) throw new NotFoundException('Reclamo no encontrado');

    // TODO: Historial (REASIGNACION_AREA)

    return updated;
  }

  // ==================================================================
  // HELPERS PRIVADOS
  // ==================================================================

  private async validateOwnershipAndStatus(reclamoId: string, userId: string, requiredStatus: EstadoReclamo): Promise<Reclamo> {
    const reclamo = await this.reclamoRepository.findById(reclamoId, false);

    if (!reclamo) {
      throw new NotFoundException(`Reclamo con ID ${reclamoId} no encontrado.`);
    }

    if (reclamo.deletedAt) {
      throw new NotFoundException(`El reclamo con ID ${reclamoId} ha sido eliminado.`);
    }

    if (reclamo.fkCliente.toString() !== userId) {
      throw new ForbiddenException('No tienes permiso para modificar este reclamo.');
    }

    if (reclamo.estado !== requiredStatus) {
      throw new BadRequestException(`Solo se pueden modificar reclamos en estado ${requiredStatus}.`);
    }

    return reclamo;
  }
}