// src/dashboard/controllers/dashboard-cliente.controller.ts

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
import { DashboardClienteQueryDto } from '../dto/dashboard-cliente-query.dto';
import { DashboardClienteResponseDto } from '../dto/dashboard-cliente-response.dto';
import { ExportQueryDto, ExportFormat } from '../dto/export-query.dto';
import type { IDashboardClienteService } from '../services/interfaces/dashboard-cliente.service.interface';
import { IDASHBOARD_CLIENTE_SERVICE } from '../services/interfaces/dashboard-cliente.service.interface';
import type { IExportService } from '../services/interfaces/export.service.interface';
import { IEXPORT_SERVICE } from '../services/interfaces/export.service.interface';

@ApiTags('Dashboard - Cliente')
@ApiBearerAuth()
@Controller('dashboard/cliente')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.CLIENTE)
export class DashboardClienteController {
  constructor(
    @Inject(IDASHBOARD_CLIENTE_SERVICE)
    private readonly dashboardService: IDashboardClienteService,
    @Inject(IEXPORT_SERVICE)
    private readonly exportService: IExportService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener métricas del dashboard de cliente',
    description: 'Retorna métricas operativas del cliente sobre sus reclamos: gráficos por proyecto, por estado, y tiempo promedio de resolución.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: DashboardClienteResponseDto,
    description: 'Métricas del dashboard',
  })
  async getDashboard(
    @Req() req: RequestWithUser,
    @Query() query: DashboardClienteQueryDto,
  ): Promise<DashboardClienteResponseDto> {
    const userId = String((req.user as any)._id);
    return this.dashboardService.getDashboardMetrics(userId, query);
  }

  @Get('export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Exportar dashboard de cliente',
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
    @Query() query: DashboardClienteQueryDto & ExportQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const userId = String((req.user as any)._id);
    const { format, ...dashboardQuery } = query;
    await this.exportService.exportClienteDashboard(userId, dashboardQuery, format, res);
  }
}

