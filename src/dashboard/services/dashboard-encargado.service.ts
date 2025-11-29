// src/dashboard/services/dashboard-encargado.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reclamo } from 'src/reclamo/schemas/reclamo.schema';
import { ReclamoEncargado } from 'src/reclamo/schemas/reclamo-encargado.schema';
import { DashboardEncargadoQueryDto } from '../dto/dashboard-encargado-query.dto';
import {
  DashboardEncargadoResponseDto,
  ClaimsPerMonthDto,
  ClaimsByTypeDto,
  AverageResolutionTimeByTypeDto,
  ResolvedClaimsPeriodDto,
} from '../dto/dashboard-encargado-response.dto';
import { IDashboardEncargadoService, IDASHBOARD_ENCARGADO_SERVICE } from './interfaces/dashboard-encargado.service.interface';
import { getDateRange } from '../helpers/date-helpers';
import { buildDateMatch, buildObjectIdFilter } from '../helpers/aggregation-helpers';
import { EstadoReclamo } from 'src/reclamo/enums/estado.enum';

@Injectable()
export class DashboardEncargadoService implements IDashboardEncargadoService {
  private readonly logger = new Logger(DashboardEncargadoService.name);

  constructor(
    @InjectModel(Reclamo.name) private readonly reclamoModel: Model<Reclamo>,
    @InjectModel(ReclamoEncargado.name) private readonly reclamoEncargadoModel: Model<ReclamoEncargado>,
  ) {}

  async getDashboardMetrics(
    encargadoId: string,
    query: DashboardEncargadoQueryDto,
  ): Promise<DashboardEncargadoResponseDto> {
    this.logger.log(`Obteniendo métricas del dashboard para encargado ${encargadoId}`);
    const { startDate, endDate, specificDay, clienteId, proyectoId, tipoReclamoId, estado, areaId } = query;
    const dateRange = getDateRange(startDate, endDate, specificDay);

    // First, get all reclamo IDs assigned to this encargado
    const assignedReclamos = await this.reclamoEncargadoModel
      .find({ fkEncargado: new Types.ObjectId(encargadoId) })
      .select('fkReclamo')
      .exec();

    const reclamoIds = assignedReclamos.map((re) => re.fkReclamo.toString());

    if (reclamoIds.length === 0) {
      // No assigned claims, return empty metrics
      return {
        claimsPerMonth: [],
        claimsByType: [],
        averageResolutionTimeByType: [],
        resolvedClaimsByPeriod: [],
        averageResolvedPerPeriod: 0,
        dateRange: {
          start: dateRange.start,
          end: dateRange.end,
        },
        totalClaims: 0,
      };
    }

    // Build base match filter
    const baseMatch: any = {
      _id: { $in: reclamoIds.map((id) => new Types.ObjectId(id)) },
      deletedAt: null,
      ...buildDateMatch(startDate, endDate, specificDay, 'createdAt'),
      ...buildObjectIdFilter('fkCliente', clienteId),
      ...buildObjectIdFilter('fkProyecto', proyectoId),
      ...buildObjectIdFilter('fkTipoReclamo', tipoReclamoId),
      ...buildObjectIdFilter('fkArea', areaId),
    };

    if (estado) {
      baseMatch.estado = estado;
    }

    // 1. Claims per month (resolved and unresolved)
    const claimsPerMonthAgg = await this.reclamoModel.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          resueltos: {
            $sum: {
              $cond: [
                { $in: ['$estado', [EstadoReclamo.RESUELTO, EstadoReclamo.RECHAZADO]] },
                1,
                0,
              ],
            },
          },
          noResueltos: {
            $sum: {
              $cond: [
                { $in: ['$estado', [EstadoReclamo.RESUELTO, EstadoReclamo.RECHAZADO]] },
                0,
                1,
              ],
            },
          },
        },
      },
      {
        $project: {
          year: '$_id.year',
          month: '$_id.month',
          resueltos: 1,
          noResueltos: 1,
          total: { $add: ['$resueltos', '$noResueltos'] },
        },
      },
      { $sort: { year: 1, month: 1 } },
    ]);

    const claimsPerMonth: ClaimsPerMonthDto[] = claimsPerMonthAgg.map((item) => ({
      year: item.year,
      month: item.month,
      resueltos: item.resueltos,
      noResueltos: item.noResueltos,
      total: item.total,
    }));

    // 2. Claims by type
    const claimsByTypeAgg = await this.reclamoModel.aggregate([
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

    const claimsByType: ClaimsByTypeDto[] = claimsByTypeAgg.map((item) => ({
      tipoReclamoId: item.tipoReclamoId,
      tipoReclamoNombre: item.tipoReclamoNombre,
      cantidad: item.cantidad,
    }));

    // 3. Average resolution time by type
    const finalStates = [EstadoReclamo.RESUELTO, EstadoReclamo.RECHAZADO];
    const resolutionTimeByTypeAgg = await this.reclamoModel.aggregate([
      {
        $match: {
          ...baseMatch,
          estado: { $in: finalStates },
        },
      },
      {
        $lookup: {
          from: 'historiales',
          localField: '_id',
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
          'historial.accion': 'modificar-estado-reclamo',
          'historial.metadata.estado_actual': { $in: finalStates },
        },
      },
      {
        $group: {
          _id: '$fkTipoReclamo',
          totalDays: {
            $sum: {
              $divide: [
                { $subtract: ['$historial.fecha_hora', '$createdAt'] },
                1000 * 60 * 60 * 24,
              ],
            },
          },
          count: { $sum: 1 },
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
          promedioDias: { $divide: ['$totalDays', '$count'] },
        },
      },
      { $sort: { promedioDias: 1 } },
    ]);

    const averageResolutionTimeByType: AverageResolutionTimeByTypeDto[] = resolutionTimeByTypeAgg.map((item) => ({
      tipoReclamoId: item.tipoReclamoId,
      tipoReclamoNombre: item.tipoReclamoNombre,
      promedioDias: Math.round(item.promedioDias * 100) / 100,
    }));

    // 4. Claims resolved per period (week, day, month)
    const resolvedMatch = {
      ...baseMatch,
      estado: { $in: finalStates },
    };

    // Per month
    const resolvedPerMonthAgg = await this.reclamoModel.aggregate([
      { $match: resolvedMatch },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          cantidad: { $sum: 1 },
        },
      },
      {
        $project: {
          periodo: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              { $toString: '$_id.month' },
            ],
          },
          cantidad: 1,
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Per week
    const resolvedPerWeekAgg = await this.reclamoModel.aggregate([
      { $match: resolvedMatch },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            week: { $week: '$createdAt' },
          },
          cantidad: { $sum: 1 },
        },
      },
      {
        $project: {
          periodo: {
            $concat: [
              { $toString: '$_id.year' },
              '-W',
              { $toString: '$_id.week' },
            ],
          },
          cantidad: 1,
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Per day
    const resolvedPerDayAgg = await this.reclamoModel.aggregate([
      { $match: resolvedMatch },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          cantidad: { $sum: 1 },
        },
      },
      {
        $project: {
          periodo: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              { $toString: '$_id.month' },
              '-',
              { $toString: '$_id.day' },
            ],
          },
          cantidad: 1,
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const resolvedClaimsByPeriod: ResolvedClaimsPeriodDto[] = [
      ...resolvedPerMonthAgg.map((item) => ({ periodo: `Mes: ${item.periodo}`, cantidad: item.cantidad })),
      ...resolvedPerWeekAgg.map((item) => ({ periodo: `Semana: ${item.periodo}`, cantidad: item.cantidad })),
      ...resolvedPerDayAgg.map((item) => ({ periodo: `Día: ${item.periodo}`, cantidad: item.cantidad })),
    ];

    // 5. Average resolved per period
    const totalResolved = resolvedClaimsByPeriod.reduce((sum, item) => sum + item.cantidad, 0);
    const periodCount = resolvedClaimsByPeriod.length;
    const averageResolvedPerPeriod = periodCount > 0 ? totalResolved / periodCount : 0;

    // Total claims count
    const totalClaims = await this.reclamoModel.countDocuments(baseMatch);

    return {
      claimsPerMonth,
      claimsByType,
      averageResolutionTimeByType,
      resolvedClaimsByPeriod,
      averageResolvedPerPeriod: Math.round(averageResolvedPerPeriod * 100) / 100,
      dateRange: {
        start: dateRange.start,
        end: dateRange.end,
      },
      totalClaims,
    };
  }
}

