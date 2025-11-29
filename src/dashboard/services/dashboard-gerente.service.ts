// src/dashboard/services/dashboard-gerente.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reclamo } from 'src/reclamo/schemas/reclamo.schema';
import { ReclamoEncargado } from 'src/reclamo/schemas/reclamo-encargado.schema';
import { Historial } from 'src/historial/schemas/historial.schema';
import { User } from 'src/users/schemas/user.schema';
import { DashboardGerenteQueryDto } from '../dto/dashboard-gerente-query.dto';
import {
  DashboardGerenteResponseDto,
  WorkloadByAreaDto,
  TopEmployeeByResolvedDto,
  TopEmployeeByEfficiencyDto,
  DistributionByTypeDto,
} from '../dto/dashboard-gerente-response.dto';
import { IDashboardGerenteService, IDASHBOARD_GERENTE_SERVICE } from './interfaces/dashboard-gerente.service.interface';
import { getDateRange } from '../helpers/date-helpers';
import { buildDateMatch, buildObjectIdFilter } from '../helpers/aggregation-helpers';
import { EstadoReclamo } from 'src/reclamo/enums/estado.enum';
import { Criticidad } from 'src/reclamo/enums/criticidad.enum';
import { AccionesHistorial } from 'src/historial/helpers/acciones-historial.enum';

@Injectable()
export class DashboardGerenteService implements IDashboardGerenteService {
  private readonly logger = new Logger(DashboardGerenteService.name);

  constructor(
    @InjectModel(Reclamo.name) private readonly reclamoModel: Model<Reclamo>,
    @InjectModel(ReclamoEncargado.name) private readonly reclamoEncargadoModel: Model<ReclamoEncargado>,
    @InjectModel(Historial.name) private readonly historialModel: Model<Historial>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async getDashboardMetrics(
    query: DashboardGerenteQueryDto,
  ): Promise<DashboardGerenteResponseDto> {
    this.logger.log('Obteniendo métricas del dashboard de gerente');
    const { startDate, endDate, estado, proyectoId, topLimit = 10 } = query;
    const dateRange = getDateRange(startDate, endDate);

    // Build base match filter
    const baseMatch: any = {
      deletedAt: null,
      ...buildDateMatch(startDate, endDate, undefined, 'createdAt'),
      ...buildObjectIdFilter('fkProyecto', proyectoId),
    };

    if (estado) {
      baseMatch.estado = estado;
    }

    // 1. Workload by area
    const workloadByAreaAgg = await this.reclamoModel.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: '$fkArea',
          cantidad: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'areas',
          localField: '_id',
          foreignField: '_id',
          as: 'area',
        },
      },
      { $unwind: { path: '$area', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          areaId: { $toString: '$_id' },
          areaNombre: { $ifNull: ['$area.nombre', 'Área Desconocida'] },
          cantidad: 1,
        },
      },
      { $sort: { cantidad: -1 } },
    ]);

    const workloadByArea: WorkloadByAreaDto[] = workloadByAreaAgg.map((item) => ({
      areaId: item.areaId,
      areaNombre: item.areaNombre,
      cantidad: item.cantidad,
    }));

    // 2. Total claims
    const totalClaims = await this.reclamoModel.countDocuments(baseMatch);

    // 3. Top employees by resolved claims
    const finalStates = [EstadoReclamo.RESUELTO, EstadoReclamo.RECHAZADO];
    const topEmployeesByResolvedAgg = await this.reclamoEncargadoModel.aggregate([
      {
        $lookup: {
          from: 'reclamos',
          localField: 'fkReclamo',
          foreignField: '_id',
          as: 'reclamo',
        },
      },
      { $unwind: { path: '$reclamo', preserveNullAndEmptyArrays: false } },
      {
        $match: {
          'reclamo.deletedAt': null,
          'reclamo.estado': { $in: finalStates },
          ...buildDateMatch(startDate, endDate, undefined, 'reclamo.createdAt'),
          ...buildObjectIdFilter('reclamo.fkProyecto', proyectoId),
        },
      },
      {
        $group: {
          _id: '$fkEncargado',
          cantidadResueltos: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'empleado',
        },
      },
      { $unwind: { path: '$empleado', preserveNullAndEmptyArrays: false } },
      {
        $project: {
          empleadoId: { $toString: '$_id' },
          empleadoNombre: {
            $concat: [
              { $ifNull: ['$empleado.firstName', ''] },
              ' ',
              { $ifNull: ['$empleado.lastName', ''] },
            ],
          },
          empleadoEmail: '$empleado.email',
          cantidadResueltos: 1,
        },
      },
      { $sort: { cantidadResueltos: -1 } },
      { $limit: topLimit },
    ]);

    const topEmployeesByResolved: TopEmployeeByResolvedDto[] = topEmployeesByResolvedAgg.map((item) => ({
      empleadoId: item.empleadoId,
      empleadoNombre: item.empleadoNombre.trim(),
      empleadoEmail: item.empleadoEmail,
      cantidadResueltos: item.cantidadResueltos,
    }));

    // 4. Top employees by efficiency (lowest average resolution time)
    const topEmployeesByEfficiencyAgg = await this.reclamoEncargadoModel.aggregate([
      {
        $lookup: {
          from: 'reclamos',
          localField: 'fkReclamo',
          foreignField: '_id',
          as: 'reclamo',
        },
      },
      { $unwind: { path: '$reclamo', preserveNullAndEmptyArrays: false } },
      {
        $match: {
          'reclamo.deletedAt': null,
          'reclamo.estado': { $in: finalStates },
          ...buildDateMatch(startDate, endDate, undefined, 'reclamo.createdAt'),
          ...buildObjectIdFilter('reclamo.fkProyecto', proyectoId),
        },
      },
      {
        $lookup: {
          from: 'historiales',
          localField: 'fkReclamo',
          foreignField: 'reclamoId',
          as: 'historial',
        },
      },
      {
        $unwind: {
          path: '$historial',
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $match: {
          'historial.accion': AccionesHistorial.CAMBIO_ESTADO,
          'historial.metadata.estado_actual': { $in: finalStates },
        },
      },
      {
        $group: {
          _id: '$fkEncargado',
          totalDays: {
            $sum: {
              $divide: [
                { $subtract: ['$historial.fecha_hora', '$reclamo.createdAt'] },
                1000 * 60 * 60 * 24,
              ],
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'empleado',
        },
      },
      { $unwind: { path: '$empleado', preserveNullAndEmptyArrays: false } },
      {
        $project: {
          empleadoId: { $toString: '$_id' },
          empleadoNombre: {
            $concat: [
              { $ifNull: ['$empleado.firstName', ''] },
              ' ',
              { $ifNull: ['$empleado.lastName', ''] },
            ],
          },
          empleadoEmail: '$empleado.email',
          promedioDias: { $divide: ['$totalDays', '$count'] },
        },
      },
      { $sort: { promedioDias: 1 } }, // Ascending (lower is better)
      { $limit: topLimit },
    ]);

    const topEmployeesByEfficiency: TopEmployeeByEfficiencyDto[] = topEmployeesByEfficiencyAgg.map((item) => ({
      empleadoId: item.empleadoId,
      empleadoNombre: item.empleadoNombre.trim(),
      empleadoEmail: item.empleadoEmail,
      promedioDias: Math.round(item.promedioDias * 100) / 100,
    }));

    // 5. State changes count
    const stateChangesMatch: any = {
      accion: AccionesHistorial.CAMBIO_ESTADO,
      ...buildDateMatch(startDate, endDate, undefined, 'fecha_hora'),
    };
    const stateChangesCount = await this.historialModel.countDocuments(stateChangesMatch);

    // 6. Distribution by claim type
    const distributionByTypeAgg = await this.reclamoModel.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: '$fkTipoReclamo',
          cantidad: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'tiporeclamos',
          localField: '_id',
          foreignField: '_id',
          as: 'tipoReclamo',
        },
      },
      { $unwind: { path: '$tipoReclamo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          tipoReclamoId: { $toString: '$_id' },
          tipoReclamoNombre: { $ifNull: ['$tipoReclamo.nombre', 'Tipo Desconocido'] },
          cantidad: 1,
        },
      },
      { $sort: { cantidad: -1 } },
    ]);

    const totalForPercentage = distributionByTypeAgg.reduce((sum, item) => sum + item.cantidad, 0);
    const distributionByType: DistributionByTypeDto[] = distributionByTypeAgg.map((item) => ({
      tipoReclamoId: item.tipoReclamoId,
      tipoReclamoNombre: item.tipoReclamoNombre,
      cantidad: item.cantidad,
      porcentaje: totalForPercentage > 0 ? Math.round((item.cantidad / totalForPercentage) * 10000) / 100 : 0,
    }));

    // 7. Percentage of claims with criticidad = "SÍ"
    const criticalMatch = {
      ...baseMatch,
      criticidad: Criticidad.SI,
    };
    const criticalClaimsCount = await this.reclamoModel.countDocuments(criticalMatch);
    const percentageCriticalClaims = totalClaims > 0 ? Math.round((criticalClaimsCount / totalClaims) * 10000) / 100 : 0;

    return {
      workloadByArea,
      totalClaims,
      topEmployeesByResolved,
      topEmployeesByEfficiency,
      stateChangesCount,
      distributionByType,
      percentageCriticalClaims,
      dateRange: {
        start: dateRange.start,
        end: dateRange.end,
      },
    };
  }
}

