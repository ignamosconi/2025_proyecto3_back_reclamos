// src/reclamos/controllers/reclamo.controller.ts

import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Inject,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { CreateReclamoDto } from '../dto/create-reclamo.dto';
import { UpdateReclamoDto } from '../dto/update-reclamo.dto';
import { GetReclamoQueryDto } from '../dto/get-reclamo-query.dto';
import { PaginatedReclamoResponseDto } from '../dto/pag-reclamo-response.dto';
import { ReclamoResponseDto } from '../dto/reclamo-response.dto';
import { UpdateEncargadosDto } from '../dto/update-encargados.dto';
import { IReclamoController } from './interfaces/reclamo.controller.interface';
import type { IReclamoService } from '../service/interfaces/reclamo.service.interface';
import { ParseObjectIdPipe } from 'src/common/pipes/objectId.pipe';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import type { RequestWithUser } from 'src/auth/interfaces/request-with-user.interface';


@ApiTags('Reclamos') 
@ApiBearerAuth() 
@Controller('reclamos')
export class ReclamoController implements IReclamoController {
  constructor(
    @Inject('IReclamoService')
    private readonly reclamoService: IReclamoService,
  ) {}

  // ==================================================================
  // LÓGICA DEL CLIENTE (US 7)
  // ==================================================================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crea un nuevo reclamo asociado a un proyecto (Rol: Cliente)' })
  @ApiBody({ type: CreateReclamoDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: ReclamoResponseDto })
  @UseGuards(AuthGuard)
  async createReclamo(
    @Body() data: CreateReclamoDto,
    @Req() req: RequestWithUser,
  ): Promise<ReclamoResponseDto> {
    // Nota: La validación de fkProyecto en el DTO se recomienda hacer con class-validator + Pipe global
  const userId = String((req.user as any)._id);
    const newReclamo = await this.reclamoService.create(data, userId);
    return newReclamo.toObject() as ReclamoResponseDto;
  }
  
  @Get()
  @ApiOperation({ summary: 'Obtiene el listado de reclamos del cliente autenticado (Rol: Cliente)' })
  @ApiQuery({ type: GetReclamoQueryDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de reclamos del cliente.',
    type: PaginatedReclamoResponseDto,
  })
  @UseGuards(AuthGuard)
  async findMyReclamos(
    @Query() query: GetReclamoQueryDto,
    @Req() req: RequestWithUser,
  ): Promise<PaginatedReclamoResponseDto> {
    // El servicio ya filtra por fkCliente (userId)
    const userId = String((req.user as any)._id);
    return this.reclamoService.findAll(query, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene un reclamo específico por ID' })
  @ApiParam({ name: 'id', description: 'ID del reclamo', type: 'string' })
  @ApiResponse({ status: HttpStatus.OK, type: ReclamoResponseDto })
  async getReclamoById(
    @Param('id', ParseObjectIdPipe) id: string
  ): Promise<ReclamoResponseDto> {
    const reclamo = await this.reclamoService.findById(id);
    return reclamo.toObject() as ReclamoResponseDto;
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualiza campos no sensibles. Solo si está PENDIENTE. (Rol: Cliente)' })
  @ApiParam({ name: 'id', description: 'ID del reclamo', type: 'string' })
  @ApiBody({ type: UpdateReclamoDto })
  @ApiResponse({ status: HttpStatus.OK, type: ReclamoResponseDto })
  @UseGuards(AuthGuard)
  async updateReclamo(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() data: UpdateReclamoDto,
    @Req() req: RequestWithUser,
  ): Promise<ReclamoResponseDto> {
    const userId = String((req.user as any)._id);
    const updatedReclamo = await this.reclamoService.update(id, data, userId);
    return updatedReclamo.toObject() as ReclamoResponseDto;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminación lógica del reclamo. Solo si está PENDIENTE. (Rol: Cliente)' })
  @ApiParam({ name: 'id', description: 'ID del reclamo', type: 'string' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Reclamo eliminado lógicamente.' })
  @UseGuards(AuthGuard)
  async deleteReclamo(
    @Param('id', ParseObjectIdPipe) id: string,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    const userId = String((req.user as any)._id);
    await this.reclamoService.softDelete(id, userId);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restaura un reclamo eliminado lógicamente (Rol: Cliente)' })
  @ApiParam({ name: 'id', description: 'ID del reclamo', type: 'string' })
  @ApiResponse({ status: HttpStatus.OK, type: ReclamoResponseDto })
  @UseGuards(AuthGuard)
  async restoreReclamo(
    @Param('id', ParseObjectIdPipe) id: string,
    @Req() req: RequestWithUser,
  ): Promise<ReclamoResponseDto> {
    const userId = String((req.user as any)._id);
    const restoredReclamo = await this.reclamoService.restore(id, userId);
    return restoredReclamo.toObject() as ReclamoResponseDto;
  }

  // ==================================================================
  // LÓGICA DE FLUJO DE TRABAJO (Encargado/Admin)
  // ==================================================================

  @Post(':reclamoId/auto-assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autoasigna un encargado al reclamo y cambia estado a EN_REVISION (US 11). (Rol: Encargado)' })
  @ApiParam({ name: 'reclamoId', description: 'ID del reclamo', type: 'string' })
  @ApiResponse({ status: HttpStatus.OK, type: ReclamoResponseDto })
  async autoAssignReclamo(
    @Param('reclamoId', ParseObjectIdPipe) reclamoId: string, 
    encargadoId: string, 
  ): Promise<ReclamoResponseDto> {
    const updatedReclamo = await this.reclamoService.autoAssign(
      reclamoId,
      encargadoId,
    );
    return updatedReclamo.toObject() as ReclamoResponseDto;
  }

  @Put(':reclamoId/team')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Gestiona la adición/eliminación de encargados. Solo si está EN_REVISION (US 12). (Rol: Encargado Asignado)' })
  @ApiParam({ name: 'reclamoId', description: 'ID del reclamo', type: 'string' })
  @ApiBody({ type: UpdateEncargadosDto })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Equipo del reclamo actualizado.' })
  async updateReclamoTeam(
    @Param('reclamoId', ParseObjectIdPipe) reclamoId: string, // 👈 Uso del Pipe
    adminId: string,
    @Body() data: UpdateEncargadosDto,
  ): Promise<void> {
    await this.reclamoService.updateTeam(reclamoId, adminId, data);
  }

  @Post(':reclamoId/reassign-area/:nuevaAreaId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reasigna el reclamo a una nueva área. Borra encargados y cambia el estado a PENDIENTE (US 8). (Rol: Admin)' })
  @ApiParam({ name: 'reclamoId', description: 'ID del reclamo', type: 'string' })
  @ApiParam({ name: 'nuevaAreaId', description: 'ID de la nueva área responsable', type: 'string' })
  @ApiResponse({ status: HttpStatus.OK, type: ReclamoResponseDto })
  async reassignReclamoArea(
    @Param('reclamoId', ParseObjectIdPipe) reclamoId: string, // 👈 Uso del Pipe
    @Param('nuevaAreaId', ParseObjectIdPipe) nuevaAreaId: string, // 👈 Uso del Pipe
    adminId: string,
  ): Promise<ReclamoResponseDto> {
    const updatedReclamo = await this.reclamoService.reassignArea(
      reclamoId,
      nuevaAreaId,
    );
    return updatedReclamo.toObject() as ReclamoResponseDto;
  }
}