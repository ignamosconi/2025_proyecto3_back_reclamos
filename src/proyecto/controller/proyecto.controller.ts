// src/projects/controllers/project.controller.ts

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
} from '@nestjs/common';
import { IProyectoController } from './interfaces/i-proyecto.controller';
import { ProjectDocument } from '../schemas/proyecto.schema';
import { CreateProyectoDto } from '../dto/create-proyecto.dto';
import { FilterProyectoDto } from '../dto/filter-proyecto.dto';
import { UpdateProyectoDto } from '../dto/update-proyecto.dto';
import { ProyectoService } from '../services/proyecto.service';


@Controller('proyectos')
export class ProyectoController implements IProyectoController {
  constructor(private readonly projectService: ProyectoService) {}

  // 1. CREACIÓN: POST /projects
  // Crea un nuevo proyecto.
  @Post()
  async create(
    @Body() createProjectDto: CreateProyectoDto,
  ): Promise<ProjectDocument> {
    return this.projectService.createProject(createProjectDto);
  }

  // 2. LISTADO: GET /projects
  // Devuelve todos los proyectos (no eliminados), permitiendo filtros por cliente y área.
  @Get()
  async findAll(
    @Query() filters: FilterProyectoDto,
  ): Promise<ProjectDocument[]> {
    return this.projectService.getProjects(filters);
  }

  // 3. VISUALIZAR UNO: GET /projects/:id
  // Devuelve un proyecto específico por su ID.
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ProjectDocument> {
    return this.projectService.getProjectById(id);
  }

  // 4. MODIFICACIÓN: PUT /projects/:id
  // Actualiza los datos de un proyecto.
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProyectoDto,
  ): Promise<ProjectDocument> {
    return this.projectService.updateProject(id, updateProjectDto);
  }

  // 5. ELIMINACIÓN SUAVE (SOFT DELETE): DELETE /projects/:id
  // Marca el proyecto como eliminado (isDeleted: true).
  @Delete(':id')
  @HttpCode(204) // Código 204: No Content (eliminación exitosa sin cuerpo de respuesta)
  async delete(@Param('id') id: string): Promise<void> {
    await this.projectService.deleteProject(id);
  }

  // 6. RESTAURACIÓN: PUT /projects/restore/:id
  // Restaura un proyecto previamente eliminado suavemente (isDeleted: false).
  @Put('restore/:id')
  @HttpCode(200) // Código 200: OK
  async restore(@Param('id') id: string): Promise<boolean> {
      return this.projectService.restoreProject(id);
  }
}