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
import { IImagenRepository } from '../repositories/interfaces/imagen.repository.interface';
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
    @Inject(IImagenRepository)
    private readonly imagenRepository: IImagenRepository,
  ) { }

  // ==================================================================
  // LÓGICA DEL CLIENTE (US 7)
  // ==================================================================

  async create(data: CreateReclamoDto, userId: string, file?: any): Promise<Reclamo> {

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
      // Convertimos a string por seguridad. El campo `areaResponsable` puede venir como ObjectId
      // o como documento poblado (objeto). En el segundo caso extraemos su _id.
      if (proyecto.areaResponsable && (proyecto.areaResponsable as any)._id) {
        areaId = String((proyecto.areaResponsable as any)._id);
      } else {
        areaId = String(proyecto.areaResponsable);
      }

      if (!areaId || areaId === 'undefined' || areaId === 'null') {
        throw new ConflictException(`El proyecto "${proyecto.nombre}" no tiene un Área Responsable asignada.`);
      }

    } catch (error) {
      // Capturamos errores del servicio de proyectos
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException('Error al validar el proyecto asociado.');
    }

    // 3. Crear Reclamo
    const nuevoReclamo = await this.reclamoRepository.create(data, userId, areaId);

    // 4. Guardar Imagen si existe
    if (file) {
      try {
        await this.imagenRepository.create(
          file.originalname,
          file.mimetype,
          file.buffer,
          String(nuevoReclamo._id)
        );
      } catch (error) {
        console.error('Error saving image:', error);
      }
    }

    // TODO: Emitir evento para módulo Historial (CREACION)

    return nuevoReclamo;
  }

  async findAll(query: GetReclamoQueryDto, userId: string, userRole?: string): Promise<PaginatedReclamoResponseDto> {
    // Si es Cliente, filtra por fkCliente. Si es Encargado/Gerente, devuelve todos
    const isClient = userRole === 'Cliente';
    const clientIdFilter: string | undefined = isClient ? userId : undefined;
    const result = await this.reclamoRepository.findAllPaginated(query, clientIdFilter);

    // Determinar si el usuario es staff
    const isStaff = userRole === 'ENCARGADO' || userRole === 'GERENTE';

    return {
      // Mapeamos cada documento de Mongoose al formato del DTO
      data: result.data.map((reclamo) => {
        // toObject() convierte el Documento de Mongoose a un objeto plano de JS
        const doc = reclamo.toObject();

        // Solo mostrar encargados si es staff
        if (!isStaff) {
          doc.encargados = undefined;
        }

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

  async findById(id: string, userRole?: string): Promise<Reclamo> {
    const reclamo = await this.reclamoRepository.findById(id, true); // populate = true
    if (!reclamo) {
      throw new NotFoundException(`Reclamo con ID ${id} no encontrado.`);
    }

    // Solo mostrar encargados si el usuario es Encargado o Gerente
    const isStaff = userRole === 'ENCARGADO' || userRole === 'GERENTE';
    if (!isStaff) {
      // Remover el campo encargados para usuarios que no sean staff
      (reclamo as any).encargados = undefined;
    }

    return reclamo;
  }

  async update(id: string, data: UpdateReclamoDto, userId: string): Promise<Reclamo> {
    // 1. Validar propiedad y estado
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('El cuerpo de la solicitud no puede estar vacío.');
    }
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

  async findDeleted(): Promise<Reclamo[]> {
    return this.reclamoRepository.findDeleted();
  }

  // ==================================================================
  // LÓGICA DE FLUJO DE TRABAJO (US 11, US 12, US 8)
  // ==================================================================

  async reassignArea(reclamoId: string, nuevaAreaId: string): Promise<Reclamo> {
    // 1. Limpiar encargados
    await this.reclamoRepository.clearEncargados(reclamoId);

    // 2. Actualizar Area y poner en Pendiente
    const updated = await this.reclamoRepository.updateArea(reclamoId, nuevaAreaId);

    if (!updated) throw new NotFoundException('Reclamo no encontrado');

    // TODO: Historial (REASIGNACION_AREA)

    return updated;
  }

  async changeState(reclamoId: string, data: import('../dto/change-state.dto').ChangeStateDto, actorId: string, actorRole: string): Promise<Reclamo> {
    const { estado, sintesis } = data;

    const reclamo = await this.reclamoRepository.findById(reclamoId, false);
    if (!reclamo) throw new NotFoundException('Reclamo no encontrado');

    // No permitir cambios si está en estado final
    if (reclamo.estado === (EstadoReclamo.RESUELTO) || reclamo.estado === (EstadoReclamo.RECHAZADO)) {
      throw new BadRequestException('No es posible cambiar el estado de un reclamo en estado final.');
    }

    // Validaciones de permiso: Gerente puede siempre; Encargado debe estar asignado al reclamo
    const roleNormalized = String(actorRole || '').toUpperCase();
    if (roleNormalized !== 'GERENTE') {
      if (roleNormalized === 'ENCARGADO') {
        const assigned = await this.reclamoEncargadoRepository.isEncargadoAssigned(reclamoId, actorId);
        if (!assigned) throw new ForbiddenException('No estás asignado a este reclamo.');
      } else {
        throw new ForbiddenException('Rol no autorizado para cambiar el estado.');
      }
    }

    // Requerir síntesis cuando se pasa a estados finales
    if ((estado === EstadoReclamo.RESUELTO || estado === EstadoReclamo.RECHAZADO) && !sintesis) {
      throw new BadRequestException('Se requiere síntesis/motivo al marcar el reclamo como Resuelto o Rechazado.');
    }

    // Actualizar estado
    const updated = await this.reclamoRepository.updateEstado(reclamoId, estado);
    if (!updated) throw new NotFoundException('Fallo al actualizar el estado del reclamo');

    // TODO: Emitir evento para Historial con { prevEstado, nuevoEstado, actorId, actorRole, sintesis }

    return updated;
  }


  async updateImagen(reclamoId: string, imagenId: string, data: import('../dto/update-imagen.dto').UpdateImagenDto, actorId: string): Promise<import('../schemas/imagen.schema').Imagen> {
    // Verificar que el actor es dueño del reclamo y que está en PENDIENTE
    await this.validateOwnershipAndStatus(reclamoId, actorId, EstadoReclamo.PENDIENTE);

    // Verificar existencia de la imagen y pertenencia al reclamo
    const imagen = await this.imagenRepository.findById(imagenId);
    if (!imagen) throw new NotFoundException('Imagen no encontrada');
    const imagenReclamoId = (imagen as any).fkReclamo ? String((imagen as any).fkReclamo) : String((imagen as any).fkReclamo);
    if (imagenReclamoId !== reclamoId) {
      throw new BadRequestException('La imagen no pertenece al reclamo indicado');
    }

    const updates: Partial<{ nombre: string; tipo: string; imagen: Buffer }> = {};
    if (data.nombre !== undefined) updates.nombre = data.nombre;
    if (data.tipo !== undefined) updates.tipo = data.tipo;
    if (data.imagen !== undefined) {
      // convertir base64 a Buffer
      updates.imagen = Buffer.from(data.imagen, 'base64');
    }

    const updated = await this.imagenRepository.updateById(imagenId, updates);
    if (!updated) throw new NotFoundException('Fallo al actualizar la imagen');

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

    // Asegurarnos de comparar correctamente el ID del cliente aunque fkCliente venga poblado
    const reclamoClienteId = reclamo.fkCliente && (reclamo.fkCliente as any)._id
      ? String((reclamo.fkCliente as any)._id)
      : String(reclamo.fkCliente);

    if (reclamoClienteId !== String(userId)) {
      throw new ForbiddenException('No tienes permiso para modificar este reclamo.');
    }

    if (reclamo.estado !== requiredStatus) {
      throw new BadRequestException(`Solo se pueden modificar reclamos en estado ${requiredStatus}.`);
    }

    return reclamo;
  }
}