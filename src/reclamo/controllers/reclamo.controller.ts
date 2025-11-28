// src/reclamos/controllers/reclamo.controller.ts

import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  Inject,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
import { ChangeStateDto } from '../dto/change-state.dto';
import { UpdateImagenDto } from '../dto/update-imagen.dto';
import { IReclamoController } from './interfaces/reclamo.controller.interface';
import type { IReclamoService } from '../service/interfaces/reclamo.service.interface';
import type { IImagenService } from '../service/interfaces/imagen.service.interface';
import { ParseObjectIdPipe } from 'src/common/pipes/objectId.pipe';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import type { RequestWithUser } from 'src/auth/interfaces/request-with-user.interface';
import { UserRole } from 'src/users/helpers/enum.roles';


@ApiTags('Reclamos')
@ApiBearerAuth()
@Controller('reclamos')
export class ReclamoController implements IReclamoController {
  constructor(
    @Inject('IReclamoService')
    private readonly reclamoService: IReclamoService,
    @Inject('IImagenService')
    private readonly imagenService: IImagenService,
  ) { }

  // ==================================================================
  // LÓGICA DEL CLIENTE (US 7)
  // ==================================================================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crea un nuevo reclamo asociado a un proyecto (Rol: Cliente)' })
  @ApiBody({ type: CreateReclamoDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: ReclamoResponseDto })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.CLIENTE)
  @UseInterceptors(FileInterceptor('imagen'))
  async createReclamo(
    @Body() data: CreateReclamoDto,
    @Req() req: RequestWithUser,
    @UploadedFile() file: any,
  ): Promise<ReclamoResponseDto> {
    // Nota: La validación de fkProyecto en el DTO se recomienda hacer con class-validator + Pipe global
    const userId = String((req.user as any)._id);
    const newReclamo = await this.reclamoService.create(data, userId, file);
    return newReclamo.toObject() as ReclamoResponseDto;
  }

  @Patch(':id/estado')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cambiar estado del reclamo (Encargados asignados o Gerentes)' })
  @ApiParam({ name: 'id', description: 'ID del reclamo', type: 'string' })
  @ApiBody({ type: ChangeStateDto })
  @ApiResponse({ status: HttpStatus.OK, type: ReclamoResponseDto })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ENCARGADO, UserRole.GERENTE)
  async changeState(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() data: ChangeStateDto,
    @Req() req: RequestWithUser,
  ): Promise<ReclamoResponseDto> {
    const actorId = String((req.user as any)._id);
    const actorRole = (req.user as any).role || (req.user as any).rol;
    const updated = await this.reclamoService.changeState(id, data, actorId, actorRole);
    return updated.toObject() as ReclamoResponseDto;
  }

  @Get('deleted')
  @ApiOperation({ summary: 'Obtiene reclamos eliminados lógicamente' })
  @ApiResponse({ status: HttpStatus.OK, type: [ReclamoResponseDto] })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.GERENTE) // Asumo que solo gerentes pueden ver eliminados, o tal vez cliente? Feedback no especifica rol.
  async getDeletedReclamos(): Promise<ReclamoResponseDto[]> {
    const reclamos = await this.reclamoService.findDeleted();
    return reclamos.map(r => r.toObject() as ReclamoResponseDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtiene el listado de reclamos. Clientes ven solo los suyos; Encargados/Gerentes ven todos.' })
  @ApiQuery({ type: GetReclamoQueryDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de reclamos.',
    type: PaginatedReclamoResponseDto,
  })
  @UseGuards(AuthGuard)
  async findMyReclamos(
    @Query() query: GetReclamoQueryDto,
    @Req() req: RequestWithUser,
  ): Promise<PaginatedReclamoResponseDto> {
    const userId = String((req.user as any)._id);
    const userRole = (req.user as any).rol || (req.user as any).role; // Soportar rol o role
    return this.reclamoService.findAll(query, userId, userRole);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene un reclamo específico por ID' })
  @ApiParam({ name: 'id', description: 'ID del reclamo', type: 'string' })
  @ApiResponse({ status: HttpStatus.OK, type: ReclamoResponseDto })
  async getReclamoById(
    @Param('id', ParseObjectIdPipe) id: string,
    @Req() req?: RequestWithUser,
  ): Promise<ReclamoResponseDto> {
    const userRole = req?.user ? (req.user as any).role : undefined;
    const reclamo = await this.reclamoService.findById(id, userRole);
    return reclamo.toObject() as ReclamoResponseDto;
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualiza campos no sensibles. Solo si está PENDIENTE. (Rol: Cliente)' })
  @ApiParam({ name: 'id', description: 'ID del reclamo', type: 'string' })
  @ApiBody({ type: UpdateReclamoDto })
  @ApiResponse({ status: HttpStatus.OK, type: ReclamoResponseDto })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.CLIENTE)
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
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.CLIENTE)
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
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.CLIENTE)
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
  // Reasigna el reclamo a una nueva área y limpia encargados
  @Post(':reclamoId/reassign-area/:nuevaAreaId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reasigna el reclamo a una nueva área y limpia encargados' })
  @ApiParam({ name: 'reclamoId', type: 'string' })
  @ApiParam({ name: 'nuevaAreaId', type: 'string' })
  @ApiResponse({ status: HttpStatus.OK, type: ReclamoResponseDto })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ENCARGADO, UserRole.GERENTE)
  async reassignArea(
    @Param('reclamoId', ParseObjectIdPipe) reclamoId: string,
    @Param('nuevaAreaId', ParseObjectIdPipe) nuevaAreaId: string,
  ): Promise<ReclamoResponseDto> {
    console.log('Reassign Area');
    // Nota: El servicio central maneja la lógica de reasignación (limpia encargados y actualiza área)
    const updated = await this.reclamoService.reassignArea(reclamoId, nuevaAreaId);
    return updated.toObject() as ReclamoResponseDto;
  }

  @Put(':id/imagenes/:imagenId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar imagen asociada a un reclamo (Cliente propietario, reclamo PENDIENTE)' })
  @ApiParam({ name: 'id', description: 'ID del reclamo', type: 'string' })
  @ApiParam({ name: 'imagenId', description: 'ID de la imagen', type: 'string' })
  @ApiBody({ type: UpdateImagenDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Imagen actualizada.' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.CLIENTE)
  async updateImagen(
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('imagenId', ParseObjectIdPipe) imagenId: string,
    @Body() data: UpdateImagenDto,
    @Req() req: RequestWithUser,
  ) {
    console.log('Update Imagen');
    const actorId = String((req.user as any)._id);
    const updated = await this.imagenService.update(id, imagenId, data, actorId);
    return (updated as any).toObject ? (updated as any).toObject() : updated;
  }
}