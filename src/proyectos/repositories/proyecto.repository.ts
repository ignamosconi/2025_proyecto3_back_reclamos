import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Proyecto, ProyectoDocument } from '../schemas/proyecto.schema';
import { IProyectosRepository } from './proyecto.repository.interface';
import { CreateProyectoDto } from '../dto/create-proyecto.dto';
import { UpdateProyectoDto } from '../dto/update-proyecto.dto';
import { GetProyectosQueryDto } from '../dto/get-proyecto-query.dto';
import { PaginationResponseProyectoDto } from '../dto/pag-proyecto.dto';

@Injectable()
export class ProyectosRepository implements IProyectosRepository {
  // Define las propiedades de población (populate) de las referencias FK, lo que permite ver el objeto completo.
  private readonly populates = [
    { path: 'cliente', select: 'nombre apellido email rol' },
    { path: 'areaResponsable', select: 'nombre' },
  ];
  
  // Condición base para buscar solo registros NO eliminados (activos)
  private readonly activeFilter = { deletedAt: null };

  constructor(
    @InjectModel(Proyecto.name)
    private readonly proyectoModel: Model<ProyectoDocument>,
  ) {}


  async create(data: CreateProyectoDto): Promise<ProyectoDocument> {
    const newProyecto = new this.proyectoModel(data);
    return newProyecto.save();
  }

  async findById(id: string): Promise<ProyectoDocument | null> {
    // Busca por ID y se asegura de que no esté eliminado
    return this.proyectoModel
      .findOne({ _id: id, ...this.activeFilter })
      .populate(this.populates) // Incluye la info de Cliente y Área
      .exec();
  }

  async findByName(nombre: string): Promise<ProyectoDocument | null> {
    // Busca por nombre (para unicidad) y se asegura de que no esté eliminado
    return this.proyectoModel
      .findOne({ nombre, ...this.activeFilter })
      .exec();
  }

  async findAll(query: GetProyectosQueryDto, clienteFilter?: string, areasFilter?: string[]): Promise<PaginationResponseProyectoDto> {
    
    // 1. Desglose de parámetros con valores por defecto
    const { page = 1, limit = 10, sort, search, cliente, areaResponsable, estado } = query;

    // 2. Construir Filtros Base (Soft-Delete + Filtros del DTO)
    // Aplicar filtro de estado: 'activo' = deletedAt: null, 'inactivo' = deletedAt: { $ne: null }
    const dbFilters: any = {};
    if (estado === 'inactivo') {
      dbFilters.deletedAt = { $ne: null };
    } else {
      // Por defecto o si es 'activo', mostrar solo proyectos activos
      dbFilters.deletedAt = null;
    }

    // 3. Aplicar filtros de seguridad por rol (US 14)
    if (clienteFilter) {
      // Si viene un filtro de cliente (CLIENTE solo ve sus proyectos), aplicarlo
      dbFilters.cliente = new Types.ObjectId(clienteFilter);
    } else if (cliente) {
      // Si viene en el query, aplicarlo (solo si no hay filtro de seguridad)
      dbFilters.cliente = new Types.ObjectId(cliente);
    }

    if (areasFilter && areasFilter.length > 0) {
      // Si viene un filtro de áreas (ENCARGADO solo ve proyectos de sus áreas), aplicarlo
      dbFilters.areaResponsable = { $in: areasFilter.map(id => new Types.ObjectId(id)) };
    } else if (areaResponsable) {
      // Si viene en el query, aplicarlo (solo si no hay filtro de seguridad)
      dbFilters.areaResponsable = new Types.ObjectId(areaResponsable);
    }

    // 3. Aplicar Filtro de Búsqueda (Search)
    if (search) {
        // Búsqueda en Nombre y Descripción (insensible a mayúsculas/minúsculas)
        dbFilters.$or = [
            { nombre: { $regex: search, $options: 'i' } },
            { descripcion: { $regex: search, $options: 'i' } },
        ];
    }

    // 4. Contar el total de documentos
    const total = await this.proyectoModel.countDocuments(dbFilters).exec();
    
    // 5. Aplicar Paginación y Ordenación
    const skip = (page - 1) * limit;

    const data = await this.proyectoModel
      .find(dbFilters)
      .populate(this.populates)
      .sort(sort) 
      .skip(skip) 
      .limit(limit) 
      .exec();
      
    // 6. Retornar el DTO de respuesta paginada
    return {
      data: data as Proyecto[],
      total,
      page,
      limit,
    };
}

  async update(
    id: string,
    data: UpdateProyectoDto,
  ): Promise<ProyectoDocument | null> {
    // Busca por ID y activo. { new: true } retorna el documento después de la actualización.
    return this.proyectoModel
      .findOneAndUpdate({ _id: id, ...this.activeFilter }, data, { new: true })
      .populate(this.populates)
      .exec();
  }

  async softDelete(id: string): Promise<ProyectoDocument | null> {
    const now = new Date();
    return this.proyectoModel
      .findOneAndUpdate(
        { _id: id, ...this.activeFilter },
        { deletedAt: now }, // Setea la fecha de eliminación
        { new: true },
      )
      .exec();
  }

  async findDeleted(query: GetProyectosQueryDto): Promise<PaginationResponseProyectoDto> {
    const { page = 1, limit = 10, sort, search, cliente, areaResponsable } = query;

    const dbFilters: any = { deletedAt: { $ne: null } };

    if (cliente) dbFilters.cliente = new Types.ObjectId(cliente);
    if (areaResponsable) dbFilters.areaResponsable = new Types.ObjectId(areaResponsable);

    if (search) {
      dbFilters.$or = [
        { nombre: { $regex: search, $options: 'i' } },
        { descripcion: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await this.proyectoModel.countDocuments(dbFilters);

    const skip = (page - 1) * limit;

    const data = await this.proyectoModel
      .find(dbFilters)
      .populate(this.populates)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();

    return { data, total, page, limit };
  }

  async restore(id: string): Promise<ProyectoDocument | null> {
    return this.proyectoModel
      .findOneAndUpdate(
        { _id: id, deletedAt: { $ne: null } },
        { deletedAt: null },
        { new: true }
      )
      .populate(this.populates)
      .exec();
  }

  async findRawById(id: string): Promise<ProyectoDocument | null> {
    return this.proyectoModel.findById(id).exec();
  }


}