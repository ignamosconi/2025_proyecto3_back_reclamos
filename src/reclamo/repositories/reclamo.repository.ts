// src/reclamos/repositories/reclamo.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reclamo } from '../schemas/reclamo.schema';
import { CreateReclamoDto } from '../dto/create-reclamo.dto';
import { UpdateReclamoDto } from '../dto/update-reclamo.dto';
import { GetReclamoQueryDto } from '../dto/get-reclamo-query.dto';
import { EstadoReclamo } from '../enums/estado.enum';
import { IReclamoRepository } from './interfaces/reclamo.repository.interface';

@Injectable()
export class ReclamoRepository implements IReclamoRepository {
  constructor(
    @InjectModel(Reclamo.name) private readonly reclamoModel: Model<Reclamo>,
    // NOTA: Aquí se inyectarían otros modelos/repositorios (Historial, ReclamoEncargado) 
    // para completar las transacciones de flujo de trabajo (US 8, US 11).
  ) {}

  async findById(id: string, populate: boolean = false): Promise<Reclamo | null> {
    const query = this.reclamoModel.findById(id);
    if (populate) {
      // Se pueblan las relaciones para la vista de detalle
      query.populate(['fkCliente', 'fkProyecto', 'fkTipoReclamo', 'fkArea']);
    }
    // NOTA: Se podría añadir un filtro { deletedAt: null } si se quiere ocultar el soft-deleted por defecto.
    return query.exec();
  }

  async create(reclamoData: CreateReclamoDto, fkClienteId: string, fkAreaId: string): Promise<Reclamo> {
    const createdReclamo = new this.reclamoModel({
      ...reclamoData,
      fkCliente: fkClienteId, // ID inyectado desde el token del Cliente autenticado
      fkArea: fkAreaId,       // Área asignada por defecto al crear
      estado: EstadoReclamo.PENDIENTE, // Estado inicial (US 7)
    });
    return createdReclamo.save();
  }

  async update(id: string, updateData: UpdateReclamoDto): Promise<Reclamo | null> {
    // Solo actualiza título y descripción (US 7)
    // Construir objeto de actualización dinámicamente solo con los campos que vienen en el DTO
    const updateSet: any = {};
    if (updateData.titulo !== undefined) {
      updateSet.titulo = updateData.titulo;
    }
    if (updateData.descripcion !== undefined) {
      updateSet.descripcion = updateData.descripcion;
    }

    // Si no hay nada que actualizar, devolver el reclamo sin cambios
    if (Object.keys(updateSet).length === 0) {
      return this.reclamoModel.findById(id).exec();
    }

    return this.reclamoModel.findByIdAndUpdate(
      id,
      { $set: updateSet },
      { new: true },
    ).exec();
  }

  // --- Soft Delete y Restore ---

  async softDelete(id: string): Promise<Reclamo | null> {
    // Implementación de Eliminación Lógica (US 7)
    return this.reclamoModel.findByIdAndUpdate(
      id,
      { $set: { deletedAt: new Date() } },
      { new: true },
    ).exec();
  }
  
  async restore(id: string): Promise<Reclamo | null> {
    // Restaura un reclamo, quitando la marca de eliminación lógica
    return this.reclamoModel.findByIdAndUpdate(
      id,
      { $set: { deletedAt: null } },
      { new: true },
    ).exec();
  }

  // --- Listado y Paginación (US 7) ---

  async findAllPaginated(query: GetReclamoQueryDto, fkClienteId: string): Promise<{ data: Reclamo[], total: number, page: number, limit: number }> {
    const { page, limit, estado, fkTipoReclamo, fechaInicio, fechaFin } = query;
    const skip = (page - 1) * limit;

    // Filtra automáticamente por el Cliente y excluye los eliminados lógicamente
    const filter: any = { fkCliente: fkClienteId, deletedAt: null };

    if (estado) filter.estado = estado;
    if (fkTipoReclamo) filter.fkTipoReclamo = fkTipoReclamo;

    // Filtro por rango de fechas de creación (US 7)
    if (fechaInicio || fechaFin) {
      filter.createdAt = {};
      if (fechaInicio) filter.createdAt.$gte = new Date(fechaInicio);
      if (fechaFin) filter.createdAt.$lte = new Date(fechaFin);
    }
    
    const [data, total] = await Promise.all([
      this.reclamoModel.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
      this.reclamoModel.countDocuments(filter).exec(),
    ]);

    return { data, total, page, limit };
  }
  
  // --- Métodos de Flujo de Trabajo (US 8, US 11) ---

  async updateArea(reclamoId: string, nuevaAreaId: string): Promise<Reclamo | null> {
    return this.reclamoModel.findByIdAndUpdate(
      reclamoId,
      { 
        $set: { fkArea: nuevaAreaId, estado: EstadoReclamo.PENDIENTE } 
      }, // Tras cambio de área, estado pasa a 'Pendiente' (US 8)
      { new: true },
    ).exec();
  }

 async updateEstadoToEnRevision(reclamoId: string): Promise<Reclamo | null> {
    //solo actualiza el estado del Reclamo (US 11).
    // La asignación real N:M ocurre en reclamo-encargado.
    return this.reclamoModel.findByIdAndUpdate(
        reclamoId,
        { $set: { estado: EstadoReclamo.EN_REVISION } },
        { new: true },
    ).exec();
    }

  async clearEncargados(reclamoId: string): Promise<void> {
    // Implementación pendiente: requiere la inyección del ReclamoEncargadoRepository
    // para realizar: await this.reclamoEncargadoRepository.deleteManyByReclamo(reclamoId)
    return; 
  }
}