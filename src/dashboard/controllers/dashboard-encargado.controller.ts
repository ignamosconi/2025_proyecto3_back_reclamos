// src/dashboard/controllers/dashboard-encargado.controller.ts

import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
  Res,
  HttpStatus,
  HttpCode,
  Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import type { RequestWithUser } from 'src/auth/interfaces/request-with-user.interface';
import { UserRole } from 'src/users/helpers/enum.roles';
import { DashboardEncargadoQueryDto } from '../dto/dashboard-encargado-query.dto';
import { DashboardEncargadoResponseDto } from '../dto/dashboard-encargado-response.dto';
import { ExportQueryDto, ExportFormat } from '../dto/export-query.dto';
import type { IDashboardEncargadoService } from '../services/interfaces/dashboard-encargado.service.interface';
import { IDASHBOARD_ENCARGADO_SERVICE } from '../services/interfaces/dashboard-encargado.service.interface';
import type { IExportService } from '../services/interfaces/export.service.interface';
import { IEXPORT_SERVICE } from '../services/interfaces/export.service.interface';

@ApiTags('Dashboard - Encargado')
@ApiBearerAuth()
@Controller('dashboard/encargado')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ENCARGADO)
export class DashboardEncargadoController {
  constructor(
    @Inject(IDASHBOARD_ENCARGADO_SERVICE)
    private readonly dashboardService: IDashboardEncargadoService,
    @Inject(IEXPORT_SERVICE)
    private readonly exportService: IExportService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener métricas del dashboard de encargado',
    description: 'Retorna métricas de desempeño del encargado: reclamos por mes, por tipo, tiempos de resolución, y estadísticas de resolución.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: DashboardEncargadoResponseDto,
    description: 'Métricas del dashboard',
  })
  async getDashboard(
    @Req() req: RequestWithUser,
    @Query() query: DashboardEncargadoQueryDto,
  ): Promise<DashboardEncargadoResponseDto> {
    const encargadoId = String((req.user as any)._id);
    return this.dashboardService.getDashboardMetrics(encargadoId, query);
  }

  @Get('export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Exportar dashboard de encargado',
    description: 'Exporta los datos del dashboard en formato Excel (.xlsx) o CSV',
  })
  @ApiQuery({
    name: 'format',
    enum: ExportFormat,
    description: 'Formato de exportación (xlsx o csv)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Archivo descargado',
  })
  async exportDashboard(
    @Req() req: RequestWithUser,
    @Query() query: DashboardEncargadoQueryDto & ExportQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const encargadoId = String((req.user as any)._id);
    const { format, ...dashboardQuery } = query;
    await this.exportService.exportEncargadoDashboard(encargadoId, dashboardQuery, format, res);
  }
}

