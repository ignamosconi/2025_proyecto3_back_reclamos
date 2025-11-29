// src/dashboard/services/interfaces/dashboard-encargado.service.interface.ts

import { DashboardEncargadoQueryDto } from '../../dto/dashboard-encargado-query.dto';
import { DashboardEncargadoResponseDto } from '../../dto/dashboard-encargado-response.dto';

export interface IDashboardEncargadoService {
  /**
   * Obtiene las métricas del dashboard para un encargado.
   * Incluye: reclamos por mes, por tipo, tiempos de resolución, y estadísticas de resolución.
   * Solo muestra métricas de reclamos asignados al encargado.
   * Los datos pueden ser filtrados por fecha, cliente, proyecto, tipo, estado y área.
   */
  getDashboardMetrics(
    encargadoId: string,
    query: DashboardEncargadoQueryDto,
  ): Promise<DashboardEncargadoResponseDto>;
}

export const IDASHBOARD_ENCARGADO_SERVICE = 'IDashboardEncargadoService';

