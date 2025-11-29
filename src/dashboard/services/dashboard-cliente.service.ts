// src/dashboard/services/dashboard-cliente.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reclamo } from 'src/reclamo/schemas/reclamo.schema';
import { DashboardClienteQueryDto } from '../dto/dashboard-cliente-query.dto';
import { DashboardClienteResponseDto, ClaimsPerProjectDto, ClaimsByStatusDto } from '../dto/dashboard-cliente-response.dto';
import { IDashboardClienteService, IDASHBOARD_CLIENTE_SERVICE } from './interfaces/dashboard-cliente.service.interface';
import { getDateRange } from '../helpers/date-helpers';
import { buildDateMatch } from '../helpers/aggregation-helpers';
import { EstadoReclamo } from 'src/reclamo/enums/estado.enum';

@Injectable()
export class DashboardClienteService implements IDashboardClienteService {
  private readonly logger = new Logger(DashboardClienteService.name);

  constructor(
    @InjectModel(Reclamo.name) private readonly reclamoModel: Model<Reclamo>,
  ) {}

  async getDashboardMetrics(
    userId: string,
    query: DashboardClienteQueryDto,
  ): Promise<DashboardClienteResponseDto> {
    this.logger.log(`Obteniendo métricas del dashboard para cliente ${userId}`);
    const { startDate, endDate, specificDay, proyectoId } = query;
    const dateRange = getDateRange(startDate, endDate, specificDay);

    // Build base match filter
    const baseMatch: any = {
      fkCliente: new Types.ObjectId(userId),
      deletedAt: null,
      ...buildDateMatch(startDate, endDate, specificDay, 'createdAt'),
    };

    // 1. Claims per project (globally)
    const claimsPerProjectAgg = await this.reclamoModel.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: '$fkProyecto',
          cantidad: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'proyectos',
          localField: '_id',
          foreignField: '_id',
          as: 'proyecto',
        },
      },
      { $unwind: { path: '$proyecto', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          proyectoId: { $toString: '$_id' },
          proyectoNombre: { $ifNull: ['$proyecto.nombre', 'Proyecto Desconocido'] },
          cantidad: 1,
        },
      },
      { $sort: { cantidad: -1 } },
    ]);

    const claimsPerProject: ClaimsPerProjectDto[] = claimsPerProjectAgg.map((item) => ({
      proyectoId: item.proyectoId,
      proyectoNombre: item.proyectoNombre,
      cantidad: item.cantidad,
    }));

    // 2. Claims by status (filterable by project)
    const statusMatch = { ...baseMatch };
    if (proyectoId) {
      statusMatch.fkProyecto = new Types.ObjectId(proyectoId);
    }

    const claimsByStatusAgg = await this.reclamoModel.aggregate([
      { $match: statusMatch },
      {
        $group: {
          _id: '$estado',
          cantidad: { $sum: 1 },
        },
      },
      { $sort: { cantidad: -1 } },
    ]);

    const claimsByStatus: ClaimsByStatusDto[] = claimsByStatusAgg.map((item) => ({
      estado: item._id,
      cantidad: item.cantidad,
    }));

    // 3. Average resolution time (from creation to final state)
    // For final states, we can use updatedAt as a fallback if historial is not available
    const finalStates = [EstadoReclamo.RESUELTO, EstadoReclamo.RECHAZADO];
    const resolutionTimeAgg = await this.reclamoModel.aggregate([
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
        $addFields: {
          resolvedAt: {
            $let: {
              vars: {
                estadoChange: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: '$historial',
                        as: 'h',
                        cond: {
                          $and: [
                            { $eq: ['$$h.accion', 'modificar-estado-reclamo'] },
                            { $in: ['$$h.metadata.estado_actual', finalStates] },
                          ],
                        },
                      },
                    },
                    0,
                  ],
                },
              },
              in: {
                $ifNull: ['$$estadoChange.fecha_hora', '$updatedAt'],
              },
            },
          },
        },
      },
      {
        $match: {
          resolvedAt: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: null,
          totalDays: {
            $sum: {
              $divide: [
                { $subtract: ['$resolvedAt', '$createdAt'] },
                1000 * 60 * 60 * 24, // Convert milliseconds to days
              ],
            },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    let averageResolutionTime = 0;
    if (resolutionTimeAgg.length > 0 && resolutionTimeAgg[0].count > 0) {
      averageResolutionTime = resolutionTimeAgg[0].totalDays / resolutionTimeAgg[0].count;
    }

    // Total claims count
    const totalClaims = await this.reclamoModel.countDocuments(baseMatch);

    return {
      claimsPerProject,
      claimsByStatus,
      averageResolutionTime: Math.round(averageResolutionTime * 100) / 100, // Round to 2 decimals
      dateRange: {
        start: dateRange.start,
        end: dateRange.end,
      },
      totalClaims,
    };
  }
}

