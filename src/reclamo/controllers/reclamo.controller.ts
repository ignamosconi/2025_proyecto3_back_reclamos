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
  @ApiOperation({ summary: 'Obtiene un reclamo específico por ID. CLIENTE: solo sus reclamos. ENCARGADO: reclamos de sus áreas. GERENTE: todos.' })
  @ApiParam({ name: 'id', description: 'ID del reclamo', type: 'string' })
  @ApiResponse({ status: HttpStatus.OK, type: ReclamoResponseDto })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.CLIENTE, UserRole.ENCARGADO, UserRole.GERENTE)
  async getReclamoById(
    @Param('id', ParseObjectIdPipe) id: string,
    @Req() req: RequestWithUser,
  ): Promise<ReclamoResponseDto> {
    const userId = String((req.user as any)._id);
    const userRole = (req.user as any).role || (req.user as any).rol;
    const reclamo = await this.reclamoService.findById(id, userId, userRole);
    
    // Convertir imágenes de Buffer a base64 data URLs ANTES de toObject()
    // Necesitamos acceder al documento de Mongoose directamente para obtener el Buffer
    if ((reclamo as any).imagenes && Array.isArray((reclamo as any).imagenes)) {
      (reclamo as any).imagenes = (reclamo as any).imagenes.map((imagen: any) => {
        // Acceder al documento de Mongoose directamente para obtener el Buffer
        const imagenBuffer = imagen.imagen; // Buffer del documento de Mongoose
        const imagenDoc: any = {
          _id: imagen._id,
          nombre: imagen.nombre,
          tipo: imagen.tipo,
          fkReclamo: imagen.fkReclamo,
          createdAt: imagen.createdAt,
          updatedAt: imagen.updatedAt,
        };
        
        // Si tiene el buffer de imagen, convertirlo a base64
        if (imagenBuffer) {
          let base64: string;
          
          if (Buffer.isBuffer(imagenBuffer)) {
            base64 = imagenBuffer.toString('base64');
          } else if (typeof imagenBuffer === 'string') {
            // Si ya es string, podría ser base64 puro o data URL
            if (imagenBuffer.startsWith('data:')) {
              imagenDoc.url = imagenBuffer;
              return imagenDoc;
            }
            base64 = imagenBuffer;
          } else if (imagenBuffer && imagenBuffer.data) {
            // Si es un objeto con propiedad data (puede pasar con algunos tipos)
            base64 = Buffer.from(imagenBuffer.data).toString('base64');
          } else {
            // Intentar convertir directamente
            try {
              base64 = Buffer.from(imagenBuffer).toString('base64');
            } catch (error) {
              console.error('Error al convertir imagen a base64:', error);
              return imagenDoc; // Retornar sin URL si falla
            }
          }
          
          // Crear data URL solo si tenemos base64 válido
          if (base64 && base64.length > 0) {
            const mimeType = imagenDoc.tipo || 'image/png';
            imagenDoc.url = `data:${mimeType};base64,${base64}`;
          }
        }
        
        return imagenDoc;
      });
    }
    
    // Ahora convertir el reclamo a objeto
    const reclamoObj = reclamo.toObject({ virtuals: true }) as any;
    
    return reclamoObj as ReclamoResponseDto;
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
    @Req() req: RequestWithUser,
  ): Promise<ReclamoResponseDto> {
    const actorId = String((req.user as any)._id);
    // Nota: El servicio central maneja la lógica de reasignación (limpia encargados y actualiza área)
    const updated = await this.reclamoService.reassignAreaWithActor(reclamoId, nuevaAreaId, actorId);
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
    const actorId = String((req.user as any)._id);
    const updated = await this.imagenService.update(id, imagenId, data, actorId);
    return (updated as any).toObject ? (updated as any).toObject() : updated;
  }
}