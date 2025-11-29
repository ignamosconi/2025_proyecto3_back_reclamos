// src/sintesis/controllers/sintesis.controller.ts

import {
  Controller,
  Get,
  Param,
  Inject,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SintesisResponseDto } from '../dto/sintesis-response.dto';
import type { ISintesisService } from '../services/interfaces/sintesis.service.interface';
import { ISINTESIS_SERVICE } from '../services/interfaces/sintesis.service.interface';
import { ISintesisController } from './interfaces/sintesis.controller.interface';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import type { RequestWithUser } from 'src/auth/interfaces/request-with-user.interface';
import { UserRole } from 'src/users/helpers/enum.roles';
import { ParseObjectIdPipe } from 'src/common/pipes/objectId.pipe';
import { SintesisDocument } from '../schemas/sintesis.schema';

@ApiTags('Reclamos - Síntesis')
@ApiBearerAuth()
@Controller('reclamos/:reclamoId/sintesis')
export class SintesisController implements ISintesisController {
  constructor(
    @Inject(ISINTESIS_SERVICE)
    private readonly sintesisService: ISintesisService,
  ) {}

  // ==================================================================
  // LÓGICA DE CONSULTA (US 10)
  // ==================================================================

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar todas las síntesis de un reclamo (Cliente, Encargado, Gerente)',
    description: 'Los clientes solo pueden ver síntesis de sus propios reclamos. Los encargados solo pueden ver síntesis de reclamos de sus áreas asignadas. Los gerentes pueden ver todas las síntesis.',
  })
  @ApiParam({ name: 'reclamoId', description: 'ID del reclamo', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [SintesisResponseDto],
    description: 'Lista de síntesis del reclamo ordenadas por fecha (más reciente primero)',
  })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.CLIENTE, UserRole.ENCARGADO, UserRole.GERENTE)
  async findAll(
    @Param('reclamoId', ParseObjectIdPipe) reclamoId: string,
    @Req() req: RequestWithUser,
  ): Promise<SintesisResponseDto[]> {
    const userId = String((req.user as any)._id);
    const userRole = (req.user as any).role || (req.user as any).rol;

    const sintesisList = await this.sintesisService.findByReclamoId(
      reclamoId,
      userRole,
      userId,
    );

    return sintesisList.map((s: SintesisDocument) => this.mapToResponseDto(s));
  }

  @Get(':sintesisId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener una síntesis específica (Cliente, Encargado, Gerente)',
    description: 'Los clientes solo pueden ver síntesis de sus propios reclamos. Los encargados solo pueden ver síntesis de reclamos de sus áreas asignadas. Los gerentes pueden ver todas las síntesis.',
  })
  @ApiParam({ name: 'reclamoId', description: 'ID del reclamo', type: 'string' })
  @ApiParam({ name: 'sintesisId', description: 'ID de la síntesis', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SintesisResponseDto,
    description: 'Detalle de la síntesis',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Síntesis no encontrada',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No tienes permiso para ver esta síntesis',
  })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.CLIENTE, UserRole.ENCARGADO, UserRole.GERENTE)
  async findById(
    @Param('reclamoId', ParseObjectIdPipe) reclamoId: string,
    @Param('sintesisId', ParseObjectIdPipe) sintesisId: string,
    @Req() req: RequestWithUser,
  ): Promise<SintesisResponseDto> {
    const userId = String((req.user as any)._id);
    const userRole = (req.user as any).role || (req.user as any).rol;

    const sintesis = await this.sintesisService.findById(
      sintesisId,
      reclamoId,
      userRole,
      userId,
    );

    if (!sintesis) {
      throw new NotFoundException(`Síntesis con ID ${sintesisId} no encontrada.`);
    }

    return this.mapToResponseDto(sintesis);
  }

  // ==================================================================
  // HELPERS PRIVADOS
  // ==================================================================

  /**
   * Mapea un SintesisDocument a SintesisResponseDto
   */
  private mapToResponseDto(sintesis: SintesisDocument): SintesisResponseDto {
    const doc = sintesis.toObject();
    return {
      _id: doc._id.toString(),
      nombre: doc.nombre,
      descripcion: doc.descripcion,
      fkReclamo: doc.fkReclamo?.toString() || String(doc.fkReclamo),
      fkCreador: {
        _id: (doc.fkCreador as any)?._id?.toString() || String(doc.fkCreador),
        firstName: (doc.fkCreador as any)?.firstName,
        lastName: (doc.fkCreador as any)?.lastName,
        email: (doc.fkCreador as any)?.email,
        role: (doc.fkCreador as any)?.role,
      },
      fkArea: {
        _id: (doc.fkArea as any)?._id?.toString() || String(doc.fkArea),
        nombre: (doc.fkArea as any)?.nombre,
        descripcion: (doc.fkArea as any)?.descripcion,
      },
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    } as SintesisResponseDto;
  }
}

