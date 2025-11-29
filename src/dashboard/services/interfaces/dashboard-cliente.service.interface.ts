// src/dashboard/services/interfaces/dashboard-cliente.service.interface.ts

import { DashboardClienteQueryDto } from '../../dto/dashboard-cliente-query.dto';
import { DashboardClienteResponseDto } from '../../dto/dashboard-cliente-response.dto';

export interface IDashboardClienteService {
  /**
   * Obtiene las métricas del dashboard para un cliente.
   * Incluye: reclamos por proyecto, reclamos por estado, y tiempo promedio de resolución.
   * Los datos pueden ser filtrados por rango de fechas o día específico.
   */
  getDashboardMetrics(
    userId: string,
    query: DashboardClienteQueryDto,
  ): Promise<DashboardClienteResponseDto>;
}

export const IDASHBOARD_CLIENTE_SERVICE = 'IDashboardClienteService';

