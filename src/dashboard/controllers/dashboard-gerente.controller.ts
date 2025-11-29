// src/dashboard/controllers/dashboard-gerente.controller.ts

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
import { DashboardGerenteQueryDto } from '../dto/dashboard-gerente-query.dto';
import { DashboardGerenteResponseDto } from '../dto/dashboard-gerente-response.dto';
import { ExportQueryDto, ExportFormat } from '../dto/export-query.dto';
import type { IDashboardGerenteService } from '../services/interfaces/dashboard-gerente.service.interface';
import { IDASHBOARD_GERENTE_SERVICE } from '../services/interfaces/dashboard-gerente.service.interface';
import type { IExportService } from '../services/interfaces/export.service.interface';
import { IEXPORT_SERVICE } from '../services/interfaces/export.service.interface';

@ApiTags('Dashboard - Gerente')
@ApiBearerAuth()
@Controller('dashboard/gerente')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.GERENTE)
export class DashboardGerenteController {
  constructor(
    @Inject(IDASHBOARD_GERENTE_SERVICE)
    private readonly dashboardService: IDashboardGerenteService,
    @Inject(IEXPORT_SERVICE)
    private readonly exportService: IExportService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener métricas del dashboard de gerente',
    description: 'Retorna métricas estratégicas globales: carga de trabajo por área, top empleados, distribuciones, y porcentajes.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: DashboardGerenteResponseDto,
    description: 'Métricas del dashboard',
  })
  async getDashboard(
    @Query() query: DashboardGerenteQueryDto,
  ): Promise<DashboardGerenteResponseDto> {
    return this.dashboardService.getDashboardMetrics(query);
  }

  @Get('export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Exportar dashboard de gerente',
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
    @Query() query: DashboardGerenteQueryDto & ExportQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const { format, ...dashboardQuery } = query;
    await this.exportService.exportGerenteDashboard(dashboardQuery, format, res);
  }
}

