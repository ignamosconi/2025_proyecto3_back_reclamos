// src/dashboard/services/interfaces/export.service.interface.ts

import { Response } from 'express';
import { ExportFormat } from '../../dto/export-query.dto';

export interface IExportService {
  exportClienteDashboard(
    userId: string,
    query: any,
    format: ExportFormat,
    res: Response,
  ): Promise<void>;

  exportEncargadoDashboard(
    encargadoId: string,
    query: any,
    format: ExportFormat,
    res: Response,
  ): Promise<void>;

  exportGerenteDashboard(
    query: any,
    format: ExportFormat,
    res: Response,
  ): Promise<void>;
}

export const IEXPORT_SERVICE = 'IExportService';

