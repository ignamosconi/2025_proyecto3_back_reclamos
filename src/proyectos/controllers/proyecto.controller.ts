import { Controller, Get, Post, Delete, Param, Body, Query, HttpCode, Inject, Patch } from '@nestjs/common';
import { IProyectosController } from './proyecto.controller.interface';
import type { IProyectosService } from '../services/proyecto.service.interface';
import { CreateProyectoDto } from '../dto/create-proyecto.dto';
import { UpdateProyectoDto } from '../dto/update-proyecto.dto';
import { Proyecto, ProyectoDocument } from '../schemas/proyecto.schema';
import { GetProyectosQueryDto } from '../dto/get-proyecto-query.dto';
import { PaginationResponseProyectoDto } from '../dto/pag-proyecto.dto';
import { ApiBadRequestResponse, ApiConflictResponse, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';

@Controller('proyectos')
// SIN IMPLEMENTACIÓN DE ROLES/AUTORIZACIÓN
export class ProyectosController implements IProyectosController {
  constructor(
    @Inject('IProyectosService')
    private readonly proyectosService: IProyectosService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear un proyecto' })
  @ApiCreatedResponse({
    description: 'Proyecto creado con éxito',
    type: Proyecto,
  })
  @ApiConflictResponse({
    description: 'Ya existe un proyecto activo con el mismo nombre',
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos (fallos de validación)',
  })
  async create(@Body() createDto: CreateProyectoDto): Promise<ProyectoDocument> {
    // El servicio se encarga de la unicidad.
    return this.proyectosService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar proyectos con paginación y filtros',
  })
  @ApiOkResponse({
    description: 'Listado paginado de proyectos',
    type: PaginationResponseProyectoDto,
  })
  async findAll(@Query() query: GetProyectosQueryDto): Promise<PaginationResponseProyectoDto> {
    // El servicio retorna todos los proyectos activos o filtrados por Query.
    return this.proyectosService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un proyecto por ID' })
  @ApiOkResponse({
    type: Proyecto,
    description: 'Proyecto encontrado',
  })
  @ApiNotFoundResponse({
    description: 'Proyecto no encontrado',
  })
  async findOne(@Param('id') id: string): Promise<ProyectoDocument> {
    // El servicio solo busca y lanza NotFound si no existe.
    return this.proyectosService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un proyecto por ID' })
  @ApiOkResponse({
    type: Proyecto,
    description: 'Proyecto actualizado correctamente',
  })
  @ApiNotFoundResponse({ description: 'Proyecto no encontrado' })
  @ApiConflictResponse({
    description: 'Otro proyecto ya tiene ese nombre',
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateProyectoDto,
  ): Promise<ProyectoDocument> {
    // El servicio se encarga de la unicidad del nombre y la actualización.
    return this.proyectosService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Eliminar (soft delete) un proyecto' })
  @ApiNoContentResponse({
    description: 'Proyecto eliminado correctamente',
  })
  async delete(@Param('id') id: string): Promise<void> {
    // El servicio solo realiza el soft-delete.
    await this.proyectosService.delete(id);
  }
}