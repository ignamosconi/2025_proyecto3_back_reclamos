import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  Inject,
} from '@nestjs/common';
import { IProyectosController } from './proyecto.controller.interface';
import type { IProyectosService } from '../services/proyecto.service.interface';
import { CreateProyectoDto } from '../dto/create-proyecto.dto';
import { UpdateProyectoDto } from '../dto/update-proyecto.dto';
import { ProyectoDocument } from '../schemas/proyecto.schema';
import { GetProyectosQueryDto } from '../dto/get-proyecto-query.dto';
import { PaginationResponseProyectoDto } from '../dto/pag-proyecto.dto';

@Controller('proyectos')
// SIN IMPLEMENTACIÓN DE ROLES/AUTORIZACIÓN
export class ProyectosController implements IProyectosController {
  constructor(
    @Inject('IProyectosService')
    private readonly proyectosService: IProyectosService,
  ) {}

  @Post()
  async create(@Body() createDto: CreateProyectoDto): Promise<ProyectoDocument> {
    // El servicio se encarga de la unicidad.
    return this.proyectosService.create(createDto);
  }

  @Get()
  async findAll(@Query() query: GetProyectosQueryDto): Promise<PaginationResponseProyectoDto> {
    // El servicio retorna todos los proyectos activos o filtrados por Query.
    return this.proyectosService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ProyectoDocument> {
    // El servicio solo busca y lanza NotFound si no existe.
    return this.proyectosService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateProyectoDto,
  ): Promise<ProyectoDocument> {
    // El servicio se encarga de la unicidad del nombre y la actualización.
    return this.proyectosService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Param('id') id: string): Promise<void> {
    // El servicio solo realiza el soft-delete.
    await this.proyectosService.delete(id);
  }
}