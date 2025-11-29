// src/dashboard/services/export.service.ts

import { Injectable, Inject, Logger } from '@nestjs/common';
import type { Response } from 'express';
import * as ExcelJS from 'exceljs';
import type { IExportService } from './interfaces/export.service.interface';
import { IEXPORT_SERVICE } from './interfaces/export.service.interface';
import { ExportFormat } from '../dto/export-query.dto';
import { DashboardClienteQueryDto } from '../dto/dashboard-cliente-query.dto';
import { DashboardEncargadoQueryDto } from '../dto/dashboard-encargado-query.dto';
import { DashboardGerenteQueryDto } from '../dto/dashboard-gerente-query.dto';
import type { IDashboardClienteService } from './interfaces/dashboard-cliente.service.interface';
import { IDASHBOARD_CLIENTE_SERVICE } from './interfaces/dashboard-cliente.service.interface';
import type { IDashboardEncargadoService } from './interfaces/dashboard-encargado.service.interface';
import { IDASHBOARD_ENCARGADO_SERVICE } from './interfaces/dashboard-encargado.service.interface';
import type { IDashboardGerenteService } from './interfaces/dashboard-gerente.service.interface';
import { IDASHBOARD_GERENTE_SERVICE } from './interfaces/dashboard-gerente.service.interface';

@Injectable()
export class ExportService implements IExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(
    @Inject(IDASHBOARD_CLIENTE_SERVICE)
    private readonly clienteDashboardService: IDashboardClienteService,
    @Inject(IDASHBOARD_ENCARGADO_SERVICE)
    private readonly encargadoDashboardService: IDashboardEncargadoService,
    @Inject(IDASHBOARD_GERENTE_SERVICE)
    private readonly gerenteDashboardService: IDashboardGerenteService,
  ) {}

  async exportClienteDashboard(
    userId: string,
    query: DashboardClienteQueryDto,
    format: ExportFormat,
    res: Response,
  ): Promise<void> {
    this.logger.log(`Exportando dashboard de cliente ${userId} en formato ${format}`);
    const metrics = await this.clienteDashboardService.getDashboardMetrics(userId, query);

    if (format === ExportFormat.XLSX) {
      await this.exportClienteToExcel(metrics, res);
    } else {
      await this.exportClienteToCsv(metrics, res);
    }
  }

  async exportEncargadoDashboard(
    encargadoId: string,
    query: DashboardEncargadoQueryDto,
    format: ExportFormat,
    res: Response,
  ): Promise<void> {
    this.logger.log(`Exportando dashboard de encargado ${encargadoId} en formato ${format}`);
    const metrics = await this.encargadoDashboardService.getDashboardMetrics(encargadoId, query);

    if (format === ExportFormat.XLSX) {
      await this.exportEncargadoToExcel(metrics, res);
    } else {
      await this.exportEncargadoToCsv(metrics, res);
    }
  }

  async exportGerenteDashboard(
    query: DashboardGerenteQueryDto,
    format: ExportFormat,
    res: Response,
  ): Promise<void> {
    this.logger.log(`Exportando dashboard de gerente en formato ${format}`);
    const metrics = await this.gerenteDashboardService.getDashboardMetrics(query);

    if (format === ExportFormat.XLSX) {
      await this.exportGerenteToExcel(metrics, res);
    } else {
      await this.exportGerenteToCsv(metrics, res);
    }
  }

  private async exportClienteToExcel(metrics: any, res: Response): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Dashboard Cliente');

    // Claims per project
    worksheet.addRow(['Reclamos por Proyecto']);
    worksheet.addRow(['Proyecto', 'Cantidad']);
    metrics.claimsPerProject.forEach((item: any) => {
      worksheet.addRow([item.proyectoNombre, item.cantidad]);
    });
    worksheet.addRow([]);

    // Claims by status
    worksheet.addRow(['Reclamos por Estado']);
    worksheet.addRow(['Estado', 'Cantidad']);
    metrics.claimsByStatus.forEach((item: any) => {
      worksheet.addRow([item.estado, item.cantidad]);
    });
    worksheet.addRow([]);

    // Summary
    worksheet.addRow(['Resumen']);
    worksheet.addRow(['Tiempo promedio de resolución (días)', metrics.averageResolutionTime || 0]);
    worksheet.addRow(['Total de reclamos', metrics.totalClaims]);
    worksheet.addRow(['Fecha inicio', new Date(metrics.dateRange.start).toLocaleDateString('es-ES')]);
    worksheet.addRow(['Fecha fin', new Date(metrics.dateRange.end).toLocaleDateString('es-ES')]);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=dashboard-cliente.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  }

  private async exportClienteToCsv(metrics: any, res: Response): Promise<void> {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=dashboard-cliente.csv');

    let csv = 'Reclamos por Proyecto\n';
    csv += 'Proyecto,Cantidad\n';
    metrics.claimsPerProject.forEach((item: any) => {
      csv += `"${item.proyectoNombre}",${item.cantidad}\n`;
    });
    csv += '\n';

    csv += 'Reclamos por Estado\n';
    csv += 'Estado,Cantidad\n';
    metrics.claimsByStatus.forEach((item: any) => {
      csv += `"${item.estado}",${item.cantidad}\n`;
    });
    csv += '\n';

    csv += 'Resumen\n';
    csv += `Tiempo promedio de resolución (días),${metrics.averageResolutionTime}\n`;
    csv += `Total de reclamos,${metrics.totalClaims}\n`;
    csv += `Fecha inicio,${metrics.dateRange.start}\n`;
    csv += `Fecha fin,${metrics.dateRange.end}\n`;

    res.send(csv);
  }

  private async exportEncargadoToExcel(metrics: any, res: Response): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Dashboard Encargado');

    // Claims per month
    worksheet.addRow(['Reclamos por Mes']);
    worksheet.addRow(['Año', 'Mes', 'Resueltos', 'No Resueltos', 'Total']);
    metrics.claimsPerMonth.forEach((item: any) => {
      worksheet.addRow([item.year, item.month, item.resueltos, item.noResueltos, item.total]);
    });
    worksheet.addRow([]);

    // Claims by type
    worksheet.addRow(['Reclamos por Tipo']);
    worksheet.addRow(['Tipo de Reclamo', 'Cantidad']);
    metrics.claimsByType.forEach((item: any) => {
      worksheet.addRow([item.tipoReclamoNombre, item.cantidad]);
    });
    worksheet.addRow([]);

    // Average resolution time by type
    worksheet.addRow(['Tiempo Promedio de Resolución por Tipo']);
    worksheet.addRow(['Tipo de Reclamo', 'Promedio (días)']);
    if (metrics.averageResolutionTimeByType && metrics.averageResolutionTimeByType.length > 0) {
      metrics.averageResolutionTimeByType.forEach((item: any) => {
        worksheet.addRow([item.tipoReclamoNombre, item.promedioDias]);
      });
    } else {
      worksheet.addRow(['No hay datos disponibles', '-']);
    }
    worksheet.addRow([]);

    // Resolved claims by period
    worksheet.addRow(['Reclamos Resueltos por Período']);
    worksheet.addRow(['Período', 'Cantidad']);
    metrics.resolvedClaimsByPeriod.forEach((item: any) => {
      worksheet.addRow([item.periodo, item.cantidad]);
    });
    worksheet.addRow([]);

    // Summary
    worksheet.addRow(['Resumen']);
    worksheet.addRow(['Promedio resuelto por período', metrics.averageResolvedPerPeriod || 0]);
    worksheet.addRow(['Total de reclamos', metrics.totalClaims]);
    worksheet.addRow(['Fecha inicio', new Date(metrics.dateRange.start).toLocaleDateString('es-ES')]);
    worksheet.addRow(['Fecha fin', new Date(metrics.dateRange.end).toLocaleDateString('es-ES')]);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=dashboard-encargado.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  }

  private async exportEncargadoToCsv(metrics: any, res: Response): Promise<void> {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=dashboard-encargado.csv');

    let csv = 'Reclamos por Mes\n';
    csv += 'Año,Mes,Resueltos,No Resueltos,Total\n';
    metrics.claimsPerMonth.forEach((item: any) => {
      csv += `${item.year},${item.month},${item.resueltos},${item.noResueltos},${item.total}\n`;
    });
    csv += '\n';

    csv += 'Reclamos por Tipo\n';
    csv += 'Tipo de Reclamo,Cantidad\n';
    metrics.claimsByType.forEach((item: any) => {
      csv += `"${item.tipoReclamoNombre}",${item.cantidad}\n`;
    });
    csv += '\n';

    csv += 'Tiempo Promedio de Resolución por Tipo\n';
    csv += 'Tipo de Reclamo,Promedio (días)\n';
    metrics.averageResolutionTimeByType.forEach((item: any) => {
      csv += `"${item.tipoReclamoNombre}",${item.promedioDias}\n`;
    });
    csv += '\n';

    csv += 'Reclamos Resueltos por Período\n';
    csv += 'Período,Cantidad\n';
    metrics.resolvedClaimsByPeriod.forEach((item: any) => {
      csv += `"${item.periodo}",${item.cantidad}\n`;
    });
    csv += '\n';

    csv += 'Resumen\n';
    csv += `Promedio resuelto por período,${metrics.averageResolvedPerPeriod}\n`;
    csv += `Total de reclamos,${metrics.totalClaims}\n`;
    csv += `Fecha inicio,${metrics.dateRange.start}\n`;
    csv += `Fecha fin,${metrics.dateRange.end}\n`;

    res.send(csv);
  }

  private async exportGerenteToExcel(metrics: any, res: Response): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Dashboard Gerente');

    // Workload by area
    worksheet.addRow(['Carga de Trabajo por Área']);
    worksheet.addRow(['Área', 'Cantidad']);
    metrics.workloadByArea.forEach((item: any) => {
      worksheet.addRow([item.areaNombre, item.cantidad]);
    });
    worksheet.addRow([]);

    // Top employees by resolved
    worksheet.addRow(['Top Empleados por Reclamos Resueltos']);
    worksheet.addRow(['Empleado', 'Email', 'Cantidad Resueltos']);
    metrics.topEmployeesByResolved.forEach((item: any) => {
      worksheet.addRow([item.empleadoNombre, item.empleadoEmail, item.cantidadResueltos]);
    });
    worksheet.addRow([]);

    // Top employees by efficiency
    worksheet.addRow(['Top Empleados por Eficiencia']);
    worksheet.addRow(['Empleado', 'Email', 'Promedio (días)']);
    if (metrics.topEmployeesByEfficiency && metrics.topEmployeesByEfficiency.length > 0) {
      metrics.topEmployeesByEfficiency.forEach((item: any) => {
        worksheet.addRow([item.empleadoNombre, item.empleadoEmail, item.promedioDias]);
      });
    } else {
      worksheet.addRow(['No hay datos disponibles', '-', '-']);
    }
    worksheet.addRow([]);

    // Distribution by type
    worksheet.addRow(['Distribución por Tipo de Reclamo']);
    worksheet.addRow(['Tipo de Reclamo', 'Cantidad', 'Porcentaje']);
    metrics.distributionByType.forEach((item: any) => {
      worksheet.addRow([item.tipoReclamoNombre, item.cantidad, `${item.porcentaje}%`]);
    });
    worksheet.addRow([]);

    // Summary
    worksheet.addRow(['Resumen']);
    worksheet.addRow(['Total de reclamos', metrics.totalClaims]);
    worksheet.addRow(['Modificaciones de estados', metrics.stateChangesCount]);
    worksheet.addRow(['Porcentaje de reclamos críticos', `${metrics.percentageCriticalClaims}%`]);
    worksheet.addRow(['Fecha inicio', new Date(metrics.dateRange.start).toLocaleDateString('es-ES')]);
    worksheet.addRow(['Fecha fin', new Date(metrics.dateRange.end).toLocaleDateString('es-ES')]);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=dashboard-gerente.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  }

  private async exportGerenteToCsv(metrics: any, res: Response): Promise<void> {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=dashboard-gerente.csv');

    let csv = 'Carga de Trabajo por Área\n';
    csv += 'Área,Cantidad\n';
    metrics.workloadByArea.forEach((item: any) => {
      csv += `"${item.areaNombre}",${item.cantidad}\n`;
    });
    csv += '\n';

    csv += 'Top Empleados por Reclamos Resueltos\n';
    csv += 'Empleado,Email,Cantidad Resueltos\n';
    metrics.topEmployeesByResolved.forEach((item: any) => {
      csv += `"${item.empleadoNombre}","${item.empleadoEmail}",${item.cantidadResueltos}\n`;
    });
    csv += '\n';

    csv += 'Top Empleados por Eficiencia\n';
    csv += 'Empleado,Email,Promedio (días)\n';
    metrics.topEmployeesByEfficiency.forEach((item: any) => {
      csv += `"${item.empleadoNombre}","${item.empleadoEmail}",${item.promedioDias}\n`;
    });
    csv += '\n';

    csv += 'Distribución por Tipo de Reclamo\n';
    csv += 'Tipo de Reclamo,Cantidad,Porcentaje\n';
    metrics.distributionByType.forEach((item: any) => {
      csv += `"${item.tipoReclamoNombre}",${item.cantidad},${item.porcentaje}%\n`;
    });
    csv += '\n';

    csv += 'Resumen\n';
    csv += `Total de reclamos,${metrics.totalClaims}\n`;
    csv += `Modificaciones de estados,${metrics.stateChangesCount}\n`;
    csv += `Porcentaje de reclamos críticos,${metrics.percentageCriticalClaims}%\n`;
    csv += `Fecha inicio,${metrics.dateRange.start}\n`;
    csv += `Fecha fin,${metrics.dateRange.end}\n`;

    res.send(csv);
  }
}

