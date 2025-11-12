// src/projects/services/project.service.ts

import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { IProyectoService } from './interfaces/i-proyecto.service';
import { ProyectoRepository } from '../repositories/proyecto.repository';
import { CreateProyectoDto } from '../dto/create-proyecto.dto';
import { ProjectDocument } from '../schemas/proyecto.schema';
import { FilterProyectoDto } from '../dto/filter-proyecto.dto';
import { UpdateProyectoDto } from '../dto/update-proyecto.dto';


@Injectable()
export class ProyectoService implements IProyectoService {
  constructor(private readonly projectRepository: ProyectoRepository) {}

  // --- REGLAS DE NEGOCIO ---

  async createProject(data: CreateProyectoDto): Promise<ProjectDocument> {
    // Criterio de Aceptación: El nombre del proyecto no podrá repetirse.
    const exists = await this.projectRepository.existsByName(data.name);

    if (exists) {
      throw new ConflictException(
        `Ya existe un proyecto activo con el nombre "${data.name}".`,
      );
    }

    return this.projectRepository.create(data);
  }

  async getProjectById(id: string): Promise<ProjectDocument> {
    const project = await this.projectRepository.findById(id);

    if (!project) {
      throw new NotFoundException(`Proyecto con ID "${id}" no encontrado.`);
    }

    return project;
  }

  async getProjects(filters: FilterProyectoDto): Promise<ProjectDocument[]> {
    // La lógica de soft delete y aplicación de filtros se maneja en el Repositorio.
    return this.projectRepository.findAll(filters);
  }

  async updateProject(
    id: string,
    data: UpdateProyectoDto,
  ): Promise<ProjectDocument> {
    // 1. Validar unicidad si se intenta actualizar el nombre.
    if (data.name) {
      const exists = await this.projectRepository.existsByName(data.name, id);
      if (exists) {
        throw new ConflictException(
          `Ya existe otro proyecto activo con el nombre "${data.name}".`,
        );
      }
    }

    // 2. Ejecutar la actualización (el repositorio verifica si el ID existe y no está eliminado).
    const updatedProject = await this.projectRepository.update(id, data);

    if (!updatedProject) {
      throw new NotFoundException(
        `Proyecto con ID "${id}" no encontrado o ya eliminado.`,
      );
    }

    return updatedProject;
  }

  async deleteProject(id: string): Promise<boolean> {
    const deleted = await this.projectRepository.softDelete(id);

    if (!deleted) {
      // Usamos NotFoundException para indicar que el proyecto no existe o ya estaba eliminado.
      throw new NotFoundException(`No se pudo eliminar el proyecto con ID "${id}". Puede que ya esté eliminado o no exista.`);
    }

    return true;
  }
  
  async restoreProject(id: string): Promise<boolean> {
    const restored = await this.projectRepository.restore(id);

    if (!restored) {
        throw new NotFoundException(`No se pudo restaurar el proyecto con ID "${id}". Puede que no exista o no estaba eliminado.`);
    }

    return true;
  }
}