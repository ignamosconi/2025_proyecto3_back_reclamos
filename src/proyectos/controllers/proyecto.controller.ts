import { Controller, Get, Post, Delete, Param, Body, Query, HttpCode, Inject, Patch, UseGuards, Req } from '@nestjs/common';
import { IProyectosController } from './proyecto.controller.interface';
import type { IProyectosService } from '../services/proyecto.service.interface';
import { CreateProyectoDto } from '../dto/create-proyecto.dto';
import { UpdateProyectoDto } from '../dto/update-proyecto.dto';
import { Proyecto, ProyectoDocument } from '../schemas/proyecto.schema';
import { GetProyectosQueryDto } from '../dto/get-proyecto-query.dto';
import { PaginationResponseProyectoDto } from '../dto/pag-proyecto.dto';
import { ApiBadRequestResponse, ApiConflictResponse, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ParseObjectIdPipe } from 'src/common/pipes/objectId.pipe';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/helpers/enum.roles';
import type { RequestWithUser } from '../../auth/interfaces/request-with-user.interface';

@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('proyectos')
export class ProyectosController implements IProyectosController {
  constructor(
    @Inject('IProyectosService')
    private readonly proyectosService: IProyectosService,
  ) {}

  @Roles(UserRole.GERENTE)
  @Post()
  @ApiOperation({ summary: 'Crear un proyecto (Solo Gerente)' })
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

  @Roles(UserRole.CLIENTE, UserRole.ENCARGADO, UserRole.GERENTE)
  @Get()
  @ApiOperation({
    summary: 'Listar proyectos con paginación y filtros. CLIENTE: solo sus proyectos. ENCARGADO: proyectos de sus áreas. GERENTE: todos.',
  })
  @ApiOkResponse({
    description: 'Listado paginado de proyectos',
    type: PaginationResponseProyectoDto,
  })
  async findAll(
    @Query() query: GetProyectosQueryDto,
    @Req() req: RequestWithUser,
  ): Promise<PaginationResponseProyectoDto> {
    const userId = String((req.user as any)._id);
    const userRole = (req.user as any).role || (req.user as any).rol;
    return this.proyectosService.findAll(query, userId, userRole);
  }

  @Roles(UserRole.GERENTE)
  @Get('deleted')
  @ApiOperation({ summary: 'Listar proyectos soft-deleted' })
  @ApiOkResponse({ type: PaginationResponseProyectoDto })
  async findDeleted(
    @Query() query: GetProyectosQueryDto
  ): Promise<PaginationResponseProyectoDto> {
    return this.proyectosService.findDeleted(query);
  }

  @Roles(UserRole.CLIENTE, UserRole.ENCARGADO, UserRole.GERENTE)
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un proyecto por ID. CLIENTE: solo sus proyectos. ENCARGADO: proyectos de sus áreas. GERENTE: todos.' })
  @ApiOkResponse({
    type: Proyecto,
    description: 'Proyecto encontrado',
  })
  @ApiNotFoundResponse({
    description: 'Proyecto no encontrado',
  })
  async findOne(
    @Param('id', ParseObjectIdPipe) id: string,
    @Req() req: RequestWithUser,
  ): Promise<ProyectoDocument> {
    const userId = String((req.user as any)._id);
    const userRole = (req.user as any).role || (req.user as any).rol;
    return this.proyectosService.findById(id, userId, userRole);
  }

  @Roles(UserRole.GERENTE)
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un proyecto por ID (Solo Gerente)' })
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
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateDto: UpdateProyectoDto,
  ): Promise<ProyectoDocument> {
    // El servicio se encarga de la unicidad del nombre y la actualización.
    return this.proyectosService.update(id, updateDto);
  }

  @Roles(UserRole.GERENTE)
  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Eliminar (soft delete) un proyecto' })
  @ApiNoContentResponse({
    description: 'Proyecto eliminado correctamente',
  })
  async delete(@Param('id', ParseObjectIdPipe) id: string): Promise<void> {
    // El servicio solo realiza el soft-delete.
    await this.proyectosService.delete(id);
  }


  @Roles(UserRole.GERENTE)
  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restaurar un proyecto soft-deleted' })
  @ApiOkResponse({ type: Proyecto })
  @ApiNotFoundResponse({ description: 'Proyecto no encontrado' })
  async restore(@Param('id', ParseObjectIdPipe) id: string): Promise<ProyectoDocument> {
    return this.proyectosService.restore(id);
  }

}