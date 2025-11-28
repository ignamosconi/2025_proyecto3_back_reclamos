// src/reclamos/repositories/reclamo.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reclamo } from '../schemas/reclamo.schema';
import { ReclamoEncargado } from '../schemas/reclamo-encargado.schema';
import { CreateReclamoDto } from '../dto/create-reclamo.dto';
import { UpdateReclamoDto } from '../dto/update-reclamo.dto';
import { GetReclamoQueryDto } from '../dto/get-reclamo-query.dto';
import { EstadoReclamo } from '../enums/estado.enum';
import { IReclamoRepository } from './interfaces/reclamo.repository.interface';

@Injectable()
export class ReclamoRepository implements IReclamoRepository {
  constructor(
    @InjectModel(Reclamo.name) private readonly reclamoModel: Model<Reclamo>,
    @InjectModel(ReclamoEncargado.name) private readonly reclamoEncargadoModel: Model<ReclamoEncargado>,
    // NOTA: Aquí se inyectarían otros modelos/repositorios (Historial, ReclamoEncargado) 
    // para completar las transacciones de flujo de trabajo (US 8, US 11).
  ) { }

  async findById(id: string, populate: boolean = false): Promise<Reclamo | null> {
    const query = this.reclamoModel.findById(id);
    if (populate) {
      // Se pueblan las relaciones para la vista de detalle
      // US 6: Ocultar password del cliente
      query.populate('fkCliente', 'nombre email role');
      query.populate(['fkProyecto', 'fkTipoReclamo', 'fkArea']);

      // US 7.a: Poblar encargados usando el virtual
      query.populate({
        path: 'encargados',
        populate: { path: 'fkEncargado', select: 'nombre email role' }
      });
    }
    // NOTA: Se podría añadir un filtro { deletedAt: null } si se quiere ocultar el soft-deleted por defecto.
    const reclamo = await query.exec();

    // Si el reclamo existe y se pide populate, transformar los encargados
    if (reclamo && populate && (reclamo as any).encargados) {
      // El virtual devuelve ReclamoEncargado[], extraemos el usuario (fkEncargado)
      (reclamo as any).encargados = (reclamo as any).encargados.map((re: any) => re.fkEncargado);
    }

    return reclamo;
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

  async findDeleted(): Promise<Reclamo[]> {
    return this.reclamoModel.find({ deletedAt: { $ne: null } }).exec();
  }

  // --- Listado y Paginación (US 7) ---

  async findAllPaginated(query: GetReclamoQueryDto, fkClienteId?: string): Promise<{ data: Reclamo[], total: number, page: number, limit: number }> {
    const { page, limit, estado, fkTipoReclamo, fechaInicio, fechaFin } = query;
    const skip = (page - 1) * limit;

    // Si fkClienteId está definido, filtra por cliente (es Cliente). Si no está, devuelve todos (es Encargado/Gerente).
    const filter: any = { deletedAt: null };

    if (fkClienteId) {
      filter.fkCliente = fkClienteId;
    }

    if (estado) filter.estado = estado;
    if (fkTipoReclamo) filter.fkTipoReclamo = fkTipoReclamo;

    // Filtro por rango de fechas de creación (US 7)
    if (fechaInicio || fechaFin) {
      filter.createdAt = {};
      if (fechaInicio) filter.createdAt.$gte = new Date(fechaInicio);
      if (fechaFin) filter.createdAt.$lte = new Date(fechaFin);
    }

    const [data, total] = await Promise.all([
      this.reclamoModel.find(filter)
        .populate({
          path: 'encargados',
          populate: { path: 'fkEncargado', select: 'nombre email role' }
        })
        .skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
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

  async updateEstado(reclamoId: string, nuevoEstado: EstadoReclamo): Promise<Reclamo | null> {
    return this.reclamoModel.findByIdAndUpdate(
      reclamoId,
      { $set: { estado: nuevoEstado } },
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
    // Elimina todas las asignaciones N:M (Reclamo <-> Encargado) para el reclamo dado.
    // Usamos directamente el modelo inyectado `reclamoEncargadoModel` para evitar
    // dependencias circulares y porque este repositorio ya lo provee.
    await this.reclamoEncargadoModel.deleteMany({ fkReclamo: new Types.ObjectId(reclamoId) }).exec();
    return;
  }
}