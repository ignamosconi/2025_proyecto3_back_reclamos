// src/projects/repositories/project.repository.ts (ACTUALIZADO)

import { Model } from 'mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IProyectoRepository } from './interfaces/i-proyecto.repository';
import { Project, ProjectDocument } from '../schemas/proyecto.schema';
import { CreateProyectoDto } from '../dto/create-proyecto.dto';
import { UpdateProyectoDto } from '../dto/update-proyecto.dto';
import { FilterProyectoDto } from '../dto/filter-proyecto.dto';


@Injectable()
export class ProyectoRepository implements IProyectoRepository {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
  ) {}

  // --- CRUD BÁSICO ---

  async create(data: CreateProyectoDto): Promise<ProjectDocument> {
    const createdProject = new this.projectModel(data);
    return createdProject.save();
  }

  async findById(id: string): Promise<ProjectDocument | null> {
    return this.projectModel.findOne({ _id: id, isDeleted: false }).exec();
  }

  async update(
    id: string,
    data: UpdateProyectoDto,
  ): Promise<ProjectDocument | null> {
    // Solo actualiza documentos NO eliminados
    return this.projectModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, data, { new: true })
      .exec();
  }

  // --- OPERACIONES DE SOFT DELETE Y RESTORE ---

  async softDelete(id: string): Promise<boolean> {
    // Solo marca como eliminado si aún no lo está (isDeleted: false)
    const result = await this.projectModel
      .updateOne({ _id: id, isDeleted: false }, { isDeleted: true })
      .exec();
      
    return result.modifiedCount > 0;
  }

  async restore(id: string): Promise<boolean> {
    // Solo restaura si el documento está marcado como eliminado (isDeleted: true)
    const result = await this.projectModel
      .updateOne({ _id: id, isDeleted: true }, { isDeleted: false })
      .exec();
      
    return result.modifiedCount > 0;
  }

  // --- OPERACIONES ESPECÍFICAS ---

  async findAll(filters: FilterProyectoDto): Promise<ProjectDocument[]> {
    const query: any = { isDeleted: false }; // Filtro esencial: ver solo activos

    if (filters.client) {
      query.client = filters.client; 
    }

    if (filters.responsibleArea) {
      query.responsibleArea = filters.responsibleArea;
    }

    return this.projectModel.find(query).exec();
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    // Solo verifica unicidad en proyectos NO eliminados
    const query: any = { name, isDeleted: false }; 

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const count = await this.projectModel.countDocuments(query).exec();
    return count > 0;
  }
}