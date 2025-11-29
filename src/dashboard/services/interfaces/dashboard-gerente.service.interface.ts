// src/dashboard/services/interfaces/dashboard-gerente.service.interface.ts

import { DashboardGerenteQueryDto } from '../../dto/dashboard-gerente-query.dto';
import { DashboardGerenteResponseDto } from '../../dto/dashboard-gerente-response.dto';

export interface IDashboardGerenteService {
  /**
   * Obtiene las métricas estratégicas del dashboard para un gerente.
   * Incluye: carga de trabajo por área, top empleados, distribuciones, y porcentajes.
   * Muestra métricas globales de todos los reclamos del sistema.
   * Los datos pueden ser filtrados por fecha, estado y proyecto.
   */
  getDashboardMetrics(
    query: DashboardGerenteQueryDto,
  ): Promise<DashboardGerenteResponseDto>;
}

export const IDASHBOARD_GERENTE_SERVICE = 'IDashboardGerenteService';

